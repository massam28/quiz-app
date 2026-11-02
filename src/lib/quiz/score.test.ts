import { describe, expect, it } from "vitest";
import { formatScore, gradeQuiz, unansweredNumbers } from "./score";
import type { Question } from "./types";

function makeQuestions(answers: number[]): Question[] {
  return answers.map((correctAnswer, i) => ({
    question: `문제 ${i + 1}`,
    options: ["1", "2", "3", "4"],
    correctAnswer,
    explanation: `해설 ${i + 1}`,
  }));
}

describe("gradeQuiz", () => {
  const sampleAnswers = [4, 2, 1, 3, 1, 3, 2, 4, 3, 1];

  it("모두 맞히면 100.0점", () => {
    const result = gradeQuiz(makeQuestions(sampleAnswers), sampleAnswers);
    expect(result.correctCount).toBe(10);
    expect(formatScore(result.score)).toBe("100.0");
  });

  it("10문항 중 8개 정답이면 80.0점이고 문항별 정오가 맞다", () => {
    const answers = [...sampleAnswers];
    answers[1] = 1;
    answers[9] = 4;
    const result = gradeQuiz(makeQuestions(sampleAnswers), answers);
    expect(result.correctCount).toBe(8);
    expect(formatScore(result.score)).toBe("80.0");
    expect(result.results.map((r) => r.isCorrect)).toEqual([
      true, false, true, true, true, true, true, true, true, false,
    ]);
    expect(result.results[1].selected).toBe(1);
  });

  it("3문항 중 2개 정답이면 66.7점", () => {
    const result = gradeQuiz(makeQuestions([1, 2, 3]), [1, 2, 4]);
    expect(result.score).toBe(66.7);
  });

  it("모두 틀리면 0.0점", () => {
    const result = gradeQuiz(makeQuestions([1, 1]), [2, 3]);
    expect(formatScore(result.score)).toBe("0.0");
  });

  it("1문항 중 1개 정답이면 100.0점, 7문항 중 1개면 14.3점", () => {
    expect(gradeQuiz(makeQuestions([1]), [1]).score).toBe(100);
    expect(gradeQuiz(makeQuestions([1, 1, 1, 1, 1, 1, 1]), [1, 2, 2, 2, 2, 2, 2]).score).toBe(14.3);
  });
});

describe("unansweredNumbers", () => {
  it("답하지 않은 문항 번호를 1부터 센다", () => {
    expect(unansweredNumbers([1, null, 3, null])).toEqual([2, 4]);
    expect(unansweredNumbers([1, 2])).toEqual([]);
  });
});
