import "server-only";
import { createHash } from "node:crypto";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { gradeQuiz, type GradeResult } from "./score";
import {
  averageScore,
  normalizeSpaces,
  normalizeStudentName,
  questionsFingerprintSource,
  titleKey,
  wrongQuestionNumbers,
} from "./records";
import type { Question, QuizFile } from "./types";

// Firestore 구성
// - papers/{자동 ID}: 교사가 등록한 문제지(정답·해설 포함). 학생에게는 서버가 정답을 뺀 내용만 보냅니다.
// - results/{문제지ID}_{이름 해시}: 학생 이름별 최신 완료 결과 1개. 다시 풀면 덮어씁니다.
// 브라우저에서 Firestore에 직접 접근하는 것은 firestore.rules에서 모두 막습니다.

const PAPERS = "papers";
const RESULTS = "results";

type PaperDoc = {
  title: string;
  titleKey: string;
  contentHash: string;
  questions: Question[];
  questionCount: number;
  published: boolean;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

type ResultDoc = {
  paperId: string;
  paperTitle: string;
  studentName: string;
  answers: number[];
  score: number;
  correctCount: number;
  total: number;
  wrongQuestions: number[];
  submittedAt: Timestamp;
};

export type PaperSummary = {
  id: string;
  title: string;
  questionCount: number;
};

export type TeacherPaperSummary = PaperSummary & {
  published: boolean;
  createdAt: string | null;
};

export type ResultRow = {
  studentName: string;
  score: number;
  wrongQuestions: number[];
  submittedAt: string | null;
};

function sha256(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

function toIso(value: unknown): string | null {
  return value instanceof Timestamp ? value.toDate().toISOString() : null;
}

export async function listPapersForTeacher(): Promise<TeacherPaperSummary[]> {
  const snap = await adminDb().collection(PAPERS).orderBy("createdAt", "desc").get();
  return snap.docs.map((doc) => {
    const d = doc.data() as PaperDoc;
    return {
      id: doc.id,
      title: d.title,
      questionCount: d.questionCount,
      published: d.published,
      createdAt: toIso(d.createdAt),
    };
  });
}

export type CreatePaperResult =
  | { ok: true; id: string }
  | { ok: false; reason: "duplicate-title" | "duplicate-content"; existingTitle: string };

// 같은 제목이나 완전히 같은 문항의 문제지가 있으면 저장하지 않습니다. 새 문제지는 비공개로 저장합니다.
export async function createPaper(quiz: QuizFile, teacherEmail: string): Promise<CreatePaperResult> {
  const db = adminDb();
  const papers = db.collection(PAPERS);
  const key = titleKey(quiz.title);
  const contentHash = sha256(questionsFingerprintSource(quiz.questions));

  return db.runTransaction(async (tx) => {
    const sameTitle = await tx.get(papers.where("titleKey", "==", key).limit(1));
    if (!sameTitle.empty) {
      return { ok: false, reason: "duplicate-title", existingTitle: sameTitle.docs[0].get("title") };
    }
    const sameContent = await tx.get(papers.where("contentHash", "==", contentHash).limit(1));
    if (!sameContent.empty) {
      return { ok: false, reason: "duplicate-content", existingTitle: sameContent.docs[0].get("title") };
    }

    const ref = papers.doc();
    tx.set(ref, {
      title: normalizeSpaces(quiz.title),
      titleKey: key,
      contentHash,
      questions: quiz.questions,
      questionCount: quiz.questions.length,
      published: false,
      createdBy: teacherEmail,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    return { ok: true, id: ref.id };
  });
}

// 없는 문제지면 false
export async function setPaperPublished(id: string, published: boolean): Promise<boolean> {
  const ref = adminDb().collection(PAPERS).doc(id);
  const snap = await ref.get();
  if (!snap.exists) return false;
  await ref.update({ published, updatedAt: FieldValue.serverTimestamp() });
  return true;
}

export async function listPublishedPapers(): Promise<PaperSummary[]> {
  const snap = await adminDb().collection(PAPERS).where("published", "==", true).get();
  return snap.docs
    .map((doc) => {
      const d = doc.data() as PaperDoc;
      return { id: doc.id, title: d.title, questionCount: d.questionCount };
    })
    .sort((a, b) => a.title.localeCompare(b.title, "ko"));
}

// 공개된 문제지만 돌려줍니다(정답·해설 포함 — 서버 안에서만 씁니다).
export async function getPublishedPaper(id: string): Promise<(QuizFile & { id: string }) | null> {
  const snap = await adminDb().collection(PAPERS).doc(id).get();
  if (!snap.exists) return null;
  const d = snap.data() as PaperDoc;
  if (!d.published) return null;
  return { id: snap.id, title: d.title, questions: d.questions };
}

export async function getPaperSummary(id: string): Promise<PaperSummary | null> {
  const snap = await adminDb().collection(PAPERS).doc(id).get();
  if (!snap.exists) return null;
  const d = snap.data() as PaperDoc;
  return { id: snap.id, title: d.title, questionCount: d.questionCount };
}

// 채점하고, 같은 문제지·같은 이름의 결과를 최신 결과로 덮어써 저장합니다.
export async function gradeAndSaveResult(
  paper: QuizFile & { id: string },
  studentName: string,
  answers: number[],
): Promise<GradeResult> {
  const grade = gradeQuiz(paper.questions, answers);
  const name = normalizeStudentName(studentName);
  const docId = `${paper.id}_${sha256(name).slice(0, 24)}`;
  const doc: Omit<ResultDoc, "submittedAt"> & { submittedAt: FieldValue } = {
    paperId: paper.id,
    paperTitle: paper.title,
    studentName: name,
    answers,
    score: grade.score,
    correctCount: grade.correctCount,
    total: grade.total,
    wrongQuestions: wrongQuestionNumbers(grade),
    submittedAt: FieldValue.serverTimestamp(),
  };
  await adminDb().collection(RESULTS).doc(docId).set(doc);
  return grade;
}

export async function listResults(
  paperId: string,
): Promise<{ rows: ResultRow[]; average: number | null }> {
  const snap = await adminDb().collection(RESULTS).where("paperId", "==", paperId).get();
  const rows = snap.docs
    .map((doc) => {
      const d = doc.data() as ResultDoc;
      return {
        studentName: d.studentName,
        score: d.score,
        wrongQuestions: d.wrongQuestions,
        submittedAt: toIso(d.submittedAt),
      };
    })
    .sort((a, b) => a.studentName.localeCompare(b.studentName, "ko"));
  return { rows, average: averageScore(rows.map((r) => r.score)) };
}
