"use client";

import { useEffect, useState } from "react";
import type { Answers, QuestionPaper, QuizFile } from "@/lib/quiz/types";
import { gradeQuiz, type GradeResult } from "@/lib/quiz/score";
import PaperListStep from "./PaperListStep";
import ReviewStep from "./ReviewStep";
import QuestionStep from "./QuestionStep";
import ResultStep from "./ResultStep";

// 화면 흐름: 문제지 목록 → 문항 확인 → 문제풀이 → 결과
// 진행 상황은 이 화면 안에만 있고, 새로고침하면 처음으로 돌아갑니다.
type State =
  | { step: "list" }
  | { step: "review"; quiz: QuizFile }
  | { step: "solving"; quiz: QuizFile; answers: Answers; index: number }
  | { step: "result"; quiz: QuizFile; grade: GradeResult };

function startSolving(quiz: QuizFile): State {
  return {
    step: "solving",
    quiz,
    answers: quiz.questions.map(() => null),
    index: 0,
  };
}

type Props = {
  papers: QuestionPaper[];
};

export default function QuizApp({ papers }: Props) {
  const [state, setState] = useState<State>({ step: "list" });

  const position = state.step === "solving" ? state.index : -1;
  useEffect(() => {
    // 휴대폰에서 다음 문제·결과로 넘어가면 화면 맨 위부터 보이게 합니다.
    window.scrollTo(0, 0);
  }, [state.step, position]);

  const toList = () => setState({ step: "list" });

  switch (state.step) {
    case "list":
      return (
        <PaperListStep papers={papers} onSelect={(quiz) => setState({ step: "review", quiz })} />
      );

    case "review":
      return (
        <ReviewStep
          title={state.quiz.title}
          questions={state.quiz.questions}
          onStart={() => setState(startSolving(state.quiz))}
          onChangePaper={toList}
        />
      );

    case "solving":
      return (
        <QuestionStep
          questions={state.quiz.questions}
          answers={state.answers}
          index={state.index}
          onSelect={(choice) =>
            setState({
              ...state,
              answers: state.answers.map((a, i) => (i === state.index ? choice : a)),
            })
          }
          onMove={(index) => setState({ ...state, index })}
          onSubmit={() =>
            setState({
              step: "result",
              quiz: state.quiz,
              grade: gradeQuiz(state.quiz.questions, state.answers),
            })
          }
        />
      );

    case "result":
      return (
        <ResultStep
          grade={state.grade}
          onRetry={() => setState(startSolving(state.quiz))}
          onChangePaper={toList}
        />
      );
  }
}
