import { describe, expect, it } from "vitest";
import { loadQuestionPapers } from "./papers";

describe("loadQuestionPapers", () => {
  it("question-papers 폴더의 문제지를 제목과 함께 읽는다", () => {
    const papers = loadQuestionPapers();
    const sample = papers.find((p) => p.fileName === "sample-questions.json");
    expect(sample?.ok).toBe(true);
    if (!sample?.ok) return;
    expect(sample.quiz.title).toBe("중학교 정보과목");
    expect(sample.quiz.questions).toHaveLength(10);
  });
});
