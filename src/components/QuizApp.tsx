"use client";

import { useCallback, useEffect, useState } from "react";
import type { Answers } from "@/lib/quiz/types";
import type { GradeResult } from "@/lib/quiz/score";
import { isCompleteAnswers, type StudentQuestion } from "@/lib/quiz/records";
import type { PaperSummary } from "@/lib/quiz/store";
import { postJson, requestJson } from "@/lib/api/client";
import PaperListStep from "./PaperListStep";
import ReviewStep from "./ReviewStep";
import QuestionStep from "./QuestionStep";
import ResultStep from "./ResultStep";

// 화면 흐름: 공개된 문제지 목록 → 문항 확인 → 문제풀이 → (서버 채점·저장) → 결과
// 풀이 중에는 정답·해설을 받지 않습니다. 제출하면 서버가 채점하고 저장한 뒤 결과를 보내줍니다.
// 진행 상황은 이 화면 안에만 있고, 새로고침하면 처음으로 돌아갑니다.
type StudentQuiz = { id: string; title: string; questions: StudentQuestion[] };

type State =
  | { step: "list" }
  | { step: "review"; quiz: StudentQuiz }
  | {
      step: "solving";
      quiz: StudentQuiz;
      answers: Answers;
      index: number;
      submitting: boolean;
      submitError?: string;
    }
  | { step: "result"; quiz: StudentQuiz; grade: GradeResult };

type ListState =
  | { status: "loading" }
  | { status: "ready"; papers: PaperSummary[] }
  | { status: "error"; message: string };

function startSolving(quiz: StudentQuiz): State {
  return {
    step: "solving",
    quiz,
    answers: quiz.questions.map(() => null),
    index: 0,
    submitting: false,
  };
}

type Props = {
  studentName: string;
};

export default function QuizApp({ studentName }: Props) {
  const [state, setState] = useState<State>({ step: "list" });
  const [list, setList] = useState<ListState>({ status: "loading" });
  const [openError, setOpenError] = useState<string | null>(null);

  const loadList = useCallback(async () => {
    setList({ status: "loading" });
    const res = await requestJson<{ papers: PaperSummary[] }>("/api/papers");
    setList(res.ok ? { status: "ready", papers: res.data.papers } : { status: "error", message: res.error });
  }, []);

  useEffect(() => {
    // 처음 목록 불러오기: 서버에서 공개된 문제지 목록을 받습니다.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadList();
  }, [loadList]);

  const position = state.step === "solving" ? state.index : -1;
  useEffect(() => {
    // 휴대폰에서 다음 문제·결과로 넘어가면 화면 맨 위부터 보이게 합니다.
    window.scrollTo(0, 0);
  }, [state.step, position]);

  const toList = () => {
    setState({ step: "list" });
    setOpenError(null);
    loadList();
  };

  const openPaper = async (id: string) => {
    setOpenError(null);
    const res = await requestJson<StudentQuiz>(`/api/papers/${encodeURIComponent(id)}`);
    if (!res.ok) {
      setOpenError(res.error);
      loadList();
      return;
    }
    setState({ step: "review", quiz: res.data });
  };

  const submit = async () => {
    if (state.step !== "solving" || state.submitting || !isCompleteAnswers(state.answers)) return;
    const current = state;
    setState({ ...current, submitting: true, submitError: undefined });
    const res = await postJson<{ grade: GradeResult }>(
      `/api/papers/${encodeURIComponent(current.quiz.id)}/submit`,
      { studentName, answers: current.answers },
    );
    if (res.ok) {
      setState({ step: "result", quiz: current.quiz, grade: res.data.grade });
    } else {
      setState({
        ...current,
        submitting: false,
        submitError: `결과를 저장하지 못했습니다. ${res.error} 고른 답은 그대로 있으니 [다시 제출]을 눌러 주세요.`,
      });
    }
  };

  switch (state.step) {
    case "list":
      return (
        <PaperListStep
          list={list}
          openError={openError}
          onSelect={openPaper}
          onReload={loadList}
        />
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
          submitting={state.submitting}
          submitError={state.submitError}
          onSelect={(choice) =>
            setState({
              ...state,
              answers: state.answers.map((a, i) => (i === state.index ? choice : a)),
            })
          }
          onMove={(index) => setState({ ...state, index })}
          onSubmit={submit}
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
