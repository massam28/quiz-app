import type { Answers, Question } from "./types";

export type QuestionResult = {
  question: Question;
  selected: number | null;
  isCorrect: boolean;
};

export type GradeResult = {
  total: number;
  correctCount: number;
  score: number; // 100점 만점, 소수 첫째 자리까지 반올림
  results: QuestionResult[];
};

// 정답 수 ÷ 전체 문항 수 × 100 (모든 문항 배점 동일)
export function gradeQuiz(questions: Question[], answers: Answers): GradeResult {
  const results = questions.map((question, i) => {
    const selected = answers[i] ?? null;
    return { question, selected, isCorrect: selected === question.correctAnswer };
  });
  const correctCount = results.filter((r) => r.isCorrect).length;
  const total = questions.length;
  // 정수로 먼저 계산해 소수 계산 오차 없이 소수 첫째 자리까지 반올림합니다.
  const score = total === 0 ? 0 : Math.round((correctCount * 1000) / total) / 10;
  return { total, correctCount, score, results };
}

export function formatScore(score: number): string {
  return score.toFixed(1);
}

// 아직 답하지 않은 문항 번호(1부터)
export function unansweredNumbers(answers: Answers): number[] {
  return answers.flatMap((a, i) => (a === null ? [i + 1] : []));
}
