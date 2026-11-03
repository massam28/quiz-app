import { describe, expect, it } from "vitest";
import { gradeQuiz } from "./score";
import {
  averageScore,
  normalizeStudentName,
  parseSubmittedAnswers,
  questionsFingerprintSource,
  titleKey,
  toStudentQuestions,
  wrongQuestionNumbers,
} from "./records";
import type { Question } from "./types";

const q = (n: number, correctAnswer = 1): Question => ({
  question: `문제 ${n}`,
  options: ["가", "나", "다", "라"],
  correctAnswer,
  explanation: `해설 ${n}`,
});

describe("toStudentQuestions", () => {
  it("정답과 해설을 빼고 문제와 보기만 남깁니다", () => {
    const result = toStudentQuestions([q(1, 3)]);
    expect(result).toEqual([{ question: "문제 1", options: ["가", "나", "다", "라"] }]);
    expect(JSON.stringify(result)).not.toContain("해설");
    expect(result[0]).not.toHaveProperty("correctAnswer");
  });
});

describe("이름·제목 정리", () => {
  it("앞뒤 빈칸과 중간 여러 빈칸을 정리합니다", () => {
    expect(normalizeStudentName("  홍길동 ")).toBe("홍길동");
    expect(normalizeStudentName("홍   길동")).toBe("홍 길동");
  });

  it("제목은 영문 대소문자도 무시합니다", () => {
    expect(titleKey(" Python  기초 ")).toBe(titleKey("python 기초"));
  });
});

describe("questionsFingerprintSource", () => {
  it("앞뒤 빈칸만 다르면 같은 내용으로 봅니다", () => {
    const a = [q(1)];
    const b = [{ ...q(1), question: " 문제 1 " }];
    expect(questionsFingerprintSource(a)).toBe(questionsFingerprintSource(b));
  });

  it("정답이 다르면 다른 내용입니다", () => {
    expect(questionsFingerprintSource([q(1, 1)])).not.toBe(questionsFingerprintSource([q(1, 2)]));
  });
});

describe("parseSubmittedAnswers", () => {
  it("문항 수만큼의 1~4 숫자만 받습니다", () => {
    expect(parseSubmittedAnswers([1, 4, 2], 3)).toEqual([1, 4, 2]);
    expect(parseSubmittedAnswers([1, 4], 3)).toBeNull();
    expect(parseSubmittedAnswers([1, 5, 2], 3)).toBeNull();
    expect(parseSubmittedAnswers([1, null, 2], 3)).toBeNull();
    expect(parseSubmittedAnswers([1, 2.5, 2], 3)).toBeNull();
    expect(parseSubmittedAnswers("1,2,3", 3)).toBeNull();
  });
});

describe("wrongQuestionNumbers", () => {
  it("틀린 문항 번호를 1부터 셉니다", () => {
    const grade = gradeQuiz([q(1, 1), q(2, 2), q(3, 3)], [1, 1, 1]);
    expect(wrongQuestionNumbers(grade)).toEqual([2, 3]);
  });
});

describe("averageScore", () => {
  it("소수 첫째 자리까지 반올림합니다", () => {
    expect(averageScore([100, 66.7, 33.3])).toBe(66.7);
    expect(averageScore([70, 80])).toBe(75);
    expect(averageScore([66.7, 66.7, 100])).toBe(77.8);
  });

  it("결과가 없으면 null입니다", () => {
    expect(averageScore([])).toBeNull();
  });
});
