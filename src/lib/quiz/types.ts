// 문제지 파일 한 문항의 형식 (PRD.md "문제지 파일" 참고)
export type Question = {
  question: string;
  options: string[]; // 항상 4개
  correctAnswer: number; // 1~4, 1이면 options의 첫 번째 보기
  explanation: string;
};

export type QuizFile = {
  title: string;
  questions: Question[];
};

// question-papers 폴더의 문제지 한 개. 형식이 잘못된 파일은 목록에 보이지만 풀 수 없습니다.
export type QuestionPaper =
  | { fileName: string; ok: true; quiz: QuizFile }
  | { fileName: string; ok: false; errors: string[] };

// 문항별로 고른 보기 번호(1~4). 아직 안 고른 문항은 null
export type Answers = (number | null)[];
