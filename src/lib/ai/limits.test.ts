import { describe, expect, it } from "vitest";
import {
  checkExtractedText,
  checkPdfFile,
  normalizeExtractedText,
  PDF_MAX_BYTES,
  TEXT_MAX_CHARS,
  validateGeneratedQuiz,
} from "./limits";
import { sampleQuiz } from "./testFixtures";

const pdf = (size: number, name = "a.pdf", type = "application/pdf") => ({ name, size, type });

describe("checkPdfFile", () => {
  it("512KiB(524,288바이트)까지 받고 1바이트라도 넘으면 거부합니다", () => {
    expect(PDF_MAX_BYTES).toBe(524_288);
    expect(checkPdfFile(pdf(524_288)).ok).toBe(true);
    expect(checkPdfFile(pdf(524_289)).ok).toBe(false);
  });

  it("빈 파일과 PDF가 아닌 파일은 거부합니다", () => {
    expect(checkPdfFile(pdf(0)).ok).toBe(false);
    expect(checkPdfFile(pdf(100, "a.txt", "text/plain")).ok).toBe(false);
    expect(checkPdfFile(pdf(100, "자료.PDF", "")).ok).toBe(true);
  });
});

describe("본문 검사", () => {
  it("줄바꿈·여러 빈칸을 한 칸으로 정리한 뒤 셉니다", () => {
    expect(normalizeExtractedText("  가\n\n나   다\t")).toBe("가 나 다");
  });

  it("12,000자까지 받고 넘으면 거부합니다(자르지 않음)", () => {
    expect(TEXT_MAX_CHARS).toBe(12_000);
    expect(checkExtractedText("가".repeat(12_000)).ok).toBe(true);
    const over = checkExtractedText("가".repeat(12_001));
    expect(over.ok).toBe(false);
    if (!over.ok) expect(over.message).toContain("12,001자");
  });

  it("글자가 없거나 너무 적으면 스캔·사진 PDF로 보고 거부합니다", () => {
    expect(checkExtractedText("").ok).toBe(false);
    expect(checkExtractedText("가 ".repeat(99)).ok).toBe(false);
    expect(checkExtractedText("가".repeat(100)).ok).toBe(true);
  });
});

describe("validateGeneratedQuiz", () => {
  it("정상 10문항은 통과합니다", () => {
    expect(validateGeneratedQuiz(sampleQuiz()).ok).toBe(true);
  });

  it("문항 수가 10개가 아니면 거부합니다", () => {
    expect(validateGeneratedQuiz(sampleQuiz(9)).ok).toBe(false);
    expect(validateGeneratedQuiz(sampleQuiz(11)).ok).toBe(false);
  });

  it("보기 3개, 정답 5, 빈 해설, 빈 제목은 거부합니다", () => {
    const q = sampleQuiz();
    expect(validateGeneratedQuiz({ ...q, questions: [{ ...q.questions[0], options: ["a", "b", "c"] }, ...q.questions.slice(1)] }).ok).toBe(false);
    expect(validateGeneratedQuiz({ ...q, questions: [{ ...q.questions[0], correctAnswer: 5 }, ...q.questions.slice(1)] }).ok).toBe(false);
    expect(validateGeneratedQuiz({ ...q, questions: [{ ...q.questions[0], explanation: " " }, ...q.questions.slice(1)] }).ok).toBe(false);
    expect(validateGeneratedQuiz({ ...q, title: "" }).ok).toBe(false);
  });

  it("기존 제목과 같으면(빈칸·대소문자 무시) 거부합니다", () => {
    expect(validateGeneratedQuiz(sampleQuiz(10, "광합성  기초"), ["광합성 기초"]).ok).toBe(false);
    expect(validateGeneratedQuiz(sampleQuiz(10, "광합성 심화"), ["광합성 기초"]).ok).toBe(true);
  });

  it("문제지 모양이 아니면 거부합니다", () => {
    expect(validateGeneratedQuiz(null).ok).toBe(false);
    expect(validateGeneratedQuiz("문제").ok).toBe(false);
  });
});
