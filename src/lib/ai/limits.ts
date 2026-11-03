import { parseQuizFile } from "../quiz/validate";
import { titleKey } from "../quiz/records";
import type { QuizFile } from "../quiz/types";

// PDF → AI 출제 규칙. 화면·서버가 함께 쓰며 PDF 도구와 Azure에 의존하지 않습니다.

// 교안의 교육용 입력 기준(플랫폼 공식 한도가 아님). 넘으면 AI를 부르지 않고 거부합니다. 자르지 않습니다.
export const PDF_MAX_BYTES = 524_288; // 512KiB
export const TEXT_MAX_CHARS = 12_000;
// 공백을 뺀 글자가 이보다 적으면 글자가 없는(스캔·사진) PDF로 봅니다.
export const TEXT_MIN_CHARS = 100;
export const QUESTION_COUNT = 10;

export type FileCheck = { ok: true } | { ok: false; message: string };

export function checkPdfFile(file: { name: string; size: number; type: string }): FileCheck {
  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  if (!isPdf) return { ok: false, message: "PDF 파일만 올릴 수 있습니다." };
  if (file.size === 0) return { ok: false, message: "빈 파일입니다. 내용이 있는 PDF를 올려 주세요." };
  if (file.size > PDF_MAX_BYTES) {
    return {
      ok: false,
      message: `파일이 너무 큽니다. 512KB(524,288바이트) 이하만 올릴 수 있습니다. (지금 ${file.size.toLocaleString("ko-KR")}바이트)`,
    };
  }
  return { ok: true };
}

// 줄바꿈·여러 칸 빈칸을 한 칸으로 정리합니다. 글자 수는 이 정리한 본문으로 셉니다.
export function normalizeExtractedText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

export function checkExtractedText(text: string): FileCheck {
  const visible = text.replace(/\s/g, "").length;
  if (visible === 0) {
    return {
      ok: false,
      message: "PDF에서 글자를 찾지 못했습니다. 스캔하거나 사진으로 만든 PDF는 지원하지 않습니다. 글자를 선택·복사할 수 있는 PDF를 올려 주세요.",
    };
  }
  if (visible < TEXT_MIN_CHARS) {
    return {
      ok: false,
      message: `PDF에서 읽을 수 있는 글자가 너무 적습니다(${visible}자). 스캔·사진 PDF는 지원하지 않습니다. 글자를 선택·복사할 수 있는 PDF를 올려 주세요.`,
    };
  }
  if (text.length > TEXT_MAX_CHARS) {
    return {
      ok: false,
      message: `PDF 본문이 너무 깁니다. 본문은 ${TEXT_MAX_CHARS.toLocaleString("ko-KR")}자 이하만 처리할 수 있습니다. (지금 ${text.length.toLocaleString("ko-KR")}자) 자료를 나눠서 올려 주세요.`,
    };
  }
  return { ok: true };
}

export type QuizCheck = { ok: true; quiz: QuizFile } | { ok: false; errors: string[] };

// AI가 만든(또는 화면을 거쳐 돌아온) 문제지를 검사합니다: 기존 JSON 형식 + 정확히 10문항 + 제목 중복 없음
export function validateGeneratedQuiz(value: unknown, existingTitles: string[] = []): QuizCheck {
  const parsed = parseQuizFile(JSON.stringify(value ?? null));
  if (!parsed.ok) return parsed;
  const errors: string[] = [];
  if (parsed.quiz.questions.length !== QUESTION_COUNT) {
    errors.push(`문항이 ${QUESTION_COUNT}개여야 합니다. (지금 ${parsed.quiz.questions.length}개)`);
  }
  const key = titleKey(parsed.quiz.title);
  if (existingTitles.some((t) => titleKey(t) === key)) {
    errors.push(`같은 제목의 문제지가 이미 있습니다: "${parsed.quiz.title}"`);
  }
  return errors.length > 0 ? { ok: false, errors } : parsed;
}
