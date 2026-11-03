// 점검용 예시 문제지(점검 파일에서만 씁니다)
export const sampleQuiz = (count = 10, title = "광합성 기초") => ({
  title,
  questions: Array.from({ length: count }, (_, i) => ({
    question: `문제 ${i + 1}`,
    options: ["가", "나", "다", "라"],
    correctAnswer: (i % 4) + 1,
    explanation: `해설 ${i + 1}`,
  })),
});
