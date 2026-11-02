import type { Question, QuizFile } from "./types";

export const OPTION_COUNT = 4;

export type ParseResult =
  | { ok: true; quiz: QuizFile }
  | { ok: false; errors: string[] };

function isFilledString(value: unknown): value is string {
  return typeof value === "string" && value.trim() !== "";
}

function checkQuestion(item: unknown, no: number): string[] {
  if (typeof item !== "object" || item === null || Array.isArray(item)) {
    return [`${no}번 문제의 형식이 올바르지 않습니다.`];
  }
  const q = item as Record<string, unknown>;
  const errors: string[] = [];

  if (!isFilledString(q.question)) {
    errors.push(`${no}번 문제의 문제 내용(question)이 비어 있습니다.`);
  }

  if (!Array.isArray(q.options)) {
    errors.push(`${no}번 문제의 보기(options)가 목록 형태가 아닙니다.`);
  } else if (q.options.length !== OPTION_COUNT) {
    errors.push(
      `${no}번 문제의 보기는 ${OPTION_COUNT}개여야 합니다. (지금 ${q.options.length}개)`,
    );
  } else {
    q.options.forEach((option, i) => {
      if (!isFilledString(option)) {
        errors.push(`${no}번 문제의 ${i + 1}번 보기가 비어 있습니다.`);
      }
    });
  }

  const answer = q.correctAnswer;
  if (
    typeof answer !== "number" ||
    !Number.isInteger(answer) ||
    answer < 1 ||
    answer > OPTION_COUNT
  ) {
    errors.push(
      `${no}번 문제의 정답 번호(correctAnswer)는 1~${OPTION_COUNT} 중 하나의 숫자여야 합니다.`,
    );
  }

  if (!isFilledString(q.explanation)) {
    errors.push(`${no}번 문제의 해설(explanation)이 비어 있습니다.`);
  }

  return errors;
}

// 문제지 파일 내용을 검사합니다. 하나라도 잘못되면 파일 전체를 받지 않습니다.
export function parseQuizFile(text: string): ParseResult {
  let data: unknown;
  try {
    // 메모장 등에서 저장한 파일 앞에 붙는 보이지 않는 문자(BOM)를 지웁니다.
    data = JSON.parse(text.replace(/^﻿/, ""));
  } catch {
    return {
      ok: false,
      errors: [
        "파일 내용을 읽을 수 없습니다. 쉼표·따옴표·괄호가 빠지지 않았는지 확인해 주세요.",
      ],
    };
  }

  const root =
    typeof data === "object" && data !== null && !Array.isArray(data)
      ? (data as Record<string, unknown>)
      : {};
  const { title, questions } = root;

  const errors: string[] = [];
  if (!isFilledString(title)) {
    errors.push("문제지 제목(title)이 비어 있습니다.");
  }

  if (!Array.isArray(questions)) {
    errors.push("파일에 문제 목록(questions)이 없습니다.");
  } else if (questions.length === 0) {
    errors.push("문제 목록(questions)에 문제가 하나도 없습니다.");
  } else {
    errors.push(...questions.flatMap((item, i) => checkQuestion(item, i + 1)));
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    quiz: {
      title: title as string,
      questions: (questions as Question[]).map((q) => ({
        question: q.question,
        options: [...q.options],
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
      })),
    },
  };
}
