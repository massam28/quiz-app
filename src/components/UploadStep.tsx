"use client";

import { useState, type ChangeEvent } from "react";
import type { QuizFile } from "@/lib/quiz/types";
import { parseQuizFile } from "@/lib/quiz/validate";

type Props = {
  onLoaded: (quiz: QuizFile, fileName: string) => void;
};

export default function UploadStep({ onLoaded }: Props) {
  const [errors, setErrors] = useState<string[]>([]);
  const [fileName, setFileName] = useState("");
  const [reading, setReading] = useState(false);

  async function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const input = e.currentTarget;
    const file = input.files?.[0];
    // 같은 파일을 고쳐서 다시 골라도 반응하도록 선택을 비웁니다.
    input.value = "";
    if (!file) return;

    setFileName(file.name);
    setErrors([]);
    setReading(true);
    let text: string;
    try {
      text = await file.text();
    } catch {
      setReading(false);
      setErrors(["파일을 열 수 없습니다. 다른 파일을 골라 주세요."]);
      return;
    }
    setReading(false);

    const result = parseQuizFile(text);
    if (result.ok) {
      onLoaded(result.quiz, file.name);
    } else {
      setErrors(result.errors);
    }
  }

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">문제풀이</h1>
        <p className="text-lg leading-relaxed text-slate-700">
          선생님께 받은 문제 파일(.json)을 올려 주세요.
          <br />
          파일을 올리면 문제를 풀 수 있습니다.
        </p>
      </div>

      <label className="flex min-h-14 cursor-pointer items-center justify-center rounded-xl bg-blue-600 px-6 text-lg font-semibold text-white hover:bg-blue-700 focus-within:outline focus-within:outline-3 focus-within:outline-offset-2 focus-within:outline-blue-400">
        파일 선택
        <input
          type="file"
          accept=".json,application/json"
          onChange={handleChange}
          className="sr-only"
        />
      </label>

      {reading && <p className="text-slate-600">파일을 읽는 중입니다…</p>}

      {errors.length > 0 && (
        <div
          role="alert"
          className="flex flex-col gap-2 rounded-xl border border-red-300 bg-red-50 p-4 text-red-900"
        >
          <p className="font-semibold">
            {fileName ? `“${fileName}” 파일을 사용할 수 없습니다.` : "파일을 사용할 수 없습니다."}
          </p>
          <ul className="list-disc space-y-1 pl-5">
            {errors.map((message, i) => (
              <li key={i}>{message}</li>
            ))}
          </ul>
          <p>파일을 고친 뒤 다시 올려 주세요.</p>
        </div>
      )}
    </section>
  );
}
