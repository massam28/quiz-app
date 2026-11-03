"use client";

import { useState } from "react";
import Link from "next/link";
import type { QuestionPaper } from "@/lib/quiz/types";
import QuizApp from "./QuizApp";
import StudentNameStep from "./StudentNameStep";

type Props = {
  papers: QuestionPaper[];
};

// 학생 화면: 이름을 입력하면 기존 문제풀이(QuizApp)로 들어갑니다.
// 이름은 이 화면 안에만 있고, 새로고침하면 다시 입력합니다.
export default function StudentApp({ papers }: Props) {
  const [name, setName] = useState<string | null>(null);

  if (name === null) {
    return <StudentNameStep onEnter={setName} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <p className="font-semibold text-slate-700">{name} 학생</p>
        <Link href="/" className="shrink-0 text-slate-500 underline hover:text-slate-800">
          첫 화면으로
        </Link>
      </div>
      <QuizApp papers={papers} />
    </div>
  );
}
