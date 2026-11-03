"use client";

import { useState } from "react";
import Link from "next/link";
import QuizApp from "./QuizApp";
import StudentNameStep from "./StudentNameStep";

// 학생 화면: 이름을 입력하면 공개된 문제지로 문제풀이(QuizApp)를 합니다.
// 이름은 제출할 때 결과와 함께 저장되고, 새로고침하면 다시 입력합니다.
// 학생 화면에는 교사 화면이나 결과표로 가는 버튼이 없습니다.
export default function StudentApp() {
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
      <QuizApp studentName={name} />
    </div>
  );
}
