import { OPTION_COUNT } from "./validate";
import type { GradeResult } from "./score";
import type { Answers, Question } from "./types";

// Firestore 저장·조회에 쓰는 규칙. 화면과 Firebase에 의존하지 않습니다.

export const STUDENT_NAME_MAX = 30;

// 학생에게 보내는 문항: 정답과 해설을 뺍니다.
export type StudentQuestion = Pick<Question, "question" | "options">;

export function toStudentQuestions(questions: Question[]): StudentQuestion[] {
  return questions.map(({ question, options }) => ({ question, options: [...options] }));
}

// 앞뒤 빈칸을 지우고 중간의 여러 빈칸을 한 칸으로 줄입니다.
export function normalizeSpaces(text: string): string {
  return text.trim().replace(/\s+/g, " ");
}

// "홍길동"과 " 홍길동 "은 같은 이름입니다.
export function normalizeStudentName(name: string): string {
  return normalizeSpaces(name);
}

// 같은 제목 판단용: 빈칸 정리 + 영문 대소문자 무시
export function titleKey(title: string): string {
  return normalizeSpaces(title).toLowerCase();
}

// 문항 내용이 완전히 같은지 비교하기 위한 글자열(앞뒤 빈칸은 무시)
export function questionsFingerprintSource(questions: Question[]): string {
  return JSON.stringify(
    questions.map((q) => [
      q.question.trim(),
      q.options.map((o) => o.trim()),
      q.correctAnswer,
      q.explanation.trim(),
    ]),
  );
}

// 학생이 보낸 답이 문항 수만큼의 1~4 숫자인지 확인합니다.
export function parseSubmittedAnswers(value: unknown, count: number): number[] | null {
  if (!Array.isArray(value) || value.length !== count) return null;
  const ok = value.every(
    (a) => typeof a === "number" && Number.isInteger(a) && a >= 1 && a <= OPTION_COUNT,
  );
  return ok ? (value as number[]) : null;
}

export function isCompleteAnswers(answers: Answers): answers is number[] {
  return answers.every((a) => a !== null);
}

// 틀린 문항 번호(1부터)
export function wrongQuestionNumbers(grade: GradeResult): number[] {
  return grade.results.flatMap((r, i) => (r.isCorrect ? [] : [i + 1]));
}

// 평균 점수(소수 첫째 자리 반올림). 점수는 0.1 단위라 10을 곱해 정수로 더합니다.
export function averageScore(scores: number[]): number | null {
  if (scores.length === 0) return null;
  const sum = scores.reduce((acc, s) => acc + Math.round(s * 10), 0);
  return Math.round(sum / scores.length) / 10;
}
