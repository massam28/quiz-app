import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parseQuizFile } from "./validate";

const good = {
  question: "문제",
  options: ["가", "나", "다", "라"],
  correctAnswer: 2,
  explanation: "해설",
};

function parse(data: unknown) {
  return parseQuizFile(JSON.stringify(data));
}

function errorsOf(data: unknown) {
  const result = parse(data);
  if (result.ok) throw new Error("오류가 나와야 합니다");
  return result.errors;
}

describe("parseQuizFile", () => {
  it("예시 파일 sample-questions.json의 10문항을 그대로 읽는다", () => {
    const text = readFileSync(join(process.cwd(), "sample-questions.json"), "utf8");
    const result = parseQuizFile(text);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.quiz.questions).toHaveLength(10);
    expect(result.quiz.questions.map((q) => q.correctAnswer)).toEqual([
      4, 2, 1, 3, 1, 3, 2, 4, 3, 1,
    ]);
    expect(result.quiz.questions[0].options[3]).toBe("키보드");
  });

  it("파일 앞의 BOM 문자를 무시한다", () => {
    const result = parseQuizFile("﻿" + JSON.stringify({ questions: [good] }));
    expect(result.ok).toBe(true);
  });

  it("JSON 형식이 깨지면 받지 않는다", () => {
    const result = parseQuizFile('{"questions": [');
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors[0]).toContain("파일 내용을 읽을 수 없습니다");
  });

  it("questions가 없거나 비어 있으면 받지 않는다", () => {
    expect(errorsOf({})).toEqual(["파일에 문제 목록(questions)이 없습니다."]);
    expect(errorsOf([good])).toEqual(["파일에 문제 목록(questions)이 없습니다."]);
    expect(errorsOf({ questions: [] })).toEqual([
      "문제 목록(questions)에 문제가 하나도 없습니다.",
    ]);
  });

  it("보기가 4개가 아니면 몇 번 문제인지 알려준다", () => {
    expect(
      errorsOf({ questions: [good, good, { ...good, options: ["가", "나", "다"] }] }),
    ).toEqual(["3번 문제의 보기는 4개여야 합니다. (지금 3개)"]);
  });

  it("정답 번호가 1~4 정수가 아니면 받지 않는다", () => {
    for (const bad of [0, 5, 2.5, "2", null]) {
      expect(errorsOf({ questions: [{ ...good, correctAnswer: bad }] })).toEqual([
        "1번 문제의 정답 번호(correctAnswer)는 1~4 중 하나의 숫자여야 합니다.",
      ]);
    }
  });

  it("빈 문제·보기·해설을 모두 찾아 알려준다", () => {
    expect(
      errorsOf({
        questions: [good, { question: " ", options: ["가", "", "다", "라"], correctAnswer: 1 }],
      }),
    ).toEqual([
      "2번 문제의 문제 내용(question)이 비어 있습니다.",
      "2번 문제의 2번 보기가 비어 있습니다.",
      "2번 문제의 해설(explanation)이 비어 있습니다.",
    ]);
  });

  it("문항이 객체가 아니면 받지 않는다", () => {
    expect(errorsOf({ questions: ["문제"] })).toEqual(["1번 문제의 형식이 올바르지 않습니다."]);
  });
});
