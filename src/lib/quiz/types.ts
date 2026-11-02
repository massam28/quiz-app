// 문제 파일 한 문항의 형식 (PRD.md "문제 파일" 참고)
export type Question = {
  question: string;
  options: string[]; // 항상 4개
  correctAnswer: number; // 1~4, 1이면 options의 첫 번째 보기
  explanation: string;
};

export type QuizFile = {
  questions: Question[];
};

// 문항별로 고른 보기 번호(1~4). 아직 안 고른 문항은 null
export type Answers = (number | null)[];
