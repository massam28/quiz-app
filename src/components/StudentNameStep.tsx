"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { normalizeStudentName, STUDENT_NAME_MAX } from "@/lib/quiz/records";

type Props = {
  onEnter: (name: string) => void;
};

// 학생 입장: 로그인 없이 이름만 입력합니다.
export default function StudentNameStep({ onEnter }: Props) {
  const [value, setValue] = useState("");
  const [showError, setShowError] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = normalizeStudentName(value);
    if (name === "") {
      setShowError(true);
      return;
    }
    onEnter(name);
  };

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <p className="text-slate-500">학생</p>
        <h1 className="text-2xl font-bold">이름을 입력해 주세요</h1>
        <p className="text-lg leading-relaxed text-slate-700">
          로그인이나 회원가입 없이 이름만 입력하면 문제를 풀 수 있습니다.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">
        <label htmlFor="student-name" className="font-semibold">
          이름
        </label>
        <input
          id="student-name"
          type="text"
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            setShowError(false);
          }}
          autoComplete="name"
          maxLength={STUDENT_NAME_MAX}
          aria-invalid={showError}
          aria-describedby={showError ? "student-name-error" : undefined}
          className="min-h-14 rounded-xl border-2 border-slate-300 bg-white px-4 text-lg focus:border-blue-500 focus:outline-none"
        />
        {showError && (
          <p id="student-name-error" role="alert" className="text-red-700">
            이름을 입력해 주세요.
          </p>
        )}
        <button
          type="submit"
          className="min-h-14 rounded-xl bg-blue-600 px-6 text-lg font-semibold text-white hover:bg-blue-700"
        >
          입장하기
        </button>
      </form>

      <Link
        href="/"
        className="flex min-h-14 items-center justify-center rounded-xl border border-slate-300 bg-white px-6 text-lg font-semibold text-slate-700 hover:bg-slate-100"
      >
        첫 화면으로
      </Link>
    </section>
  );
}
