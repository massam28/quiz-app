"use client";

import { useEffect, useState } from "react";
import type { Answers, QuizFile } from "@/lib/quiz/types";
import { gradeQuiz, type GradeResult } from "@/lib/quiz/score";
import UploadStep from "./UploadStep";
import ReviewStep from "./ReviewStep";
import QuestionStep from "./QuestionStep";
import ResultStep from "./ResultStep";

// 화면 흐름: 파일 올리기 → 문항 확인 → 문제풀이 → 결과
// 진행 상황은 이 화면 안에만 있고, 새로고침하면 처음으로 돌아갑니다(1일차 범위).
type State =
  | { step: "upload" }
  | { step: "review"; quiz: QuizFile; fileName: string }
  | { step: "solving"; quiz: QuizFile; fileName: string; answers: Answers; index: number }
  | { step: "result"; quiz: QuizFile; fileName: string; grade: GradeResult };

function startSolving(quiz: QuizFile, fileName: string): State {
  return {
    step: "solving",
    quiz,
    fileName,
    answers: quiz.questions.map(() => null),
    index: 0,
  };
}

export default function QuizApp() {
  const [state, setState] = useState<State>({ step: "upload" });

  const position = state.step === "solving" ? state.index : -1;
  useEffect(() => {
    // 휴대폰에서 다음 문제·결과로 넘어가면 화면 맨 위부터 보이게 합니다.
    window.scrollTo(0, 0);
  }, [state.step, position]);

  const toUpload = () => setState({ step: "upload" });

  switch (state.step) {
    case "upload":
      return (
        <UploadStep
          onLoaded={(quiz, fileName) => setState({ step: "review", quiz, fileName })}
        />
      );

    case "review":
      return (
        <ReviewStep
          questions={state.quiz.questions}
          fileName={state.fileName}
          onStart={() => setState(startSolving(state.quiz, state.fileName))}
          onChangeFile={toUpload}
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
              fileName: state.fileName,
              grade: gradeQuiz(state.quiz.questions, state.answers),
            })
          }
        />
      );

    case "result":
      return (
        <ResultStep
          grade={state.grade}
          onRetry={() => setState(startSolving(state.quiz, state.fileName))}
          onChangeFile={toUpload}
        />
      );
  }
}
