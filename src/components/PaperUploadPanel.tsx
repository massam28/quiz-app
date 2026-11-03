"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { parseQuizFile } from "@/lib/quiz/validate";
import type { QuizFile } from "@/lib/quiz/types";
import { teacherRequest } from "@/lib/api/client";
import QuizPreview from "./QuizPreview";

type Props = {
  onSaved: () => void;
};

type State =
  | { status: "idle"; notice?: { kind: "success" | "error"; text: string; details?: string[] } }
  | { status: "preview"; quiz: QuizFile; fileName: string; saving: boolean; error?: string };

const MAX_FILE_BYTES = 1_000_000;

// 교사: JSON 문제지 파일 올리기 → 내용 확인 → 저장(비공개)
export default function PaperUploadPanel({ onSaved }: Props) {
  const [state, setState] = useState<State>({ status: "idle" });
  const inputRef = useRef<HTMLInputElement>(null);

  const resetInput = () => {
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_BYTES) {
      setState({ status: "idle", notice: { kind: "error", text: "파일이 너무 큽니다. 1MB보다 작은 파일을 올려 주세요." } });
      resetInput();
      return;
    }
    const parsed = parseQuizFile(await file.text());
    if (!parsed.ok) {
      setState({
        status: "idle",
        notice: {
          kind: "error",
          text: `${file.name}: 형식이 올바르지 않아 등록할 수 없습니다.`,
          details: parsed.errors,
        },
      });
      resetInput();
      return;
    }
    setState({ status: "preview", quiz: parsed.quiz, fileName: file.name, saving: false });
  };

  const save = async () => {
    if (state.status !== "preview" || state.saving) return;
    const current = state;
    setState({ ...current, saving: true, error: undefined });
    const res = await teacherRequest<{ id: string }>("/api/teacher/papers", {
      method: "POST",
      data: current.quiz,
    });
    if (!res.ok) {
      const details = res.details?.length ? ` (${res.details.join(" ")})` : "";
      setState({ ...current, saving: false, error: res.error + details });
      return;
    }
    resetInput();
    setState({
      status: "idle",
      notice: {
        kind: "success",
        text: `문제지를 저장했습니다: "${current.quiz.title}". 아직 비공개입니다. 아래 목록에서 [공개하기]를 누르면 학생에게 보입니다.`,
      },
    });
    onSaved();
  };

  const cancel = () => {
    resetInput();
    setState({ status: "idle" });
  };

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold">문제 등록</h2>
        <p className="leading-relaxed text-slate-600">
          문제지 JSON 파일을 올리면 내용을 확인한 뒤 저장할 수 있습니다. 저장한 문제지는 비공개로 시작합니다.
        </p>
      </div>

      {state.status === "idle" && (
        <>
          <label className="flex min-h-14 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-slate-300 px-4 text-center font-semibold text-slate-700 hover:border-blue-500 hover:bg-blue-50">
            JSON 파일 고르기
            <input
              ref={inputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFile}
              className="sr-only"
            />
          </label>
          {state.notice && (
            <div
              role={state.notice.kind === "error" ? "alert" : "status"}
              className={`flex flex-col gap-2 rounded-xl border p-4 leading-relaxed ${
                state.notice.kind === "error"
                  ? "border-red-300 bg-red-50 text-red-900"
                  : "border-green-300 bg-green-50 text-green-900"
              }`}
            >
              <p className="font-semibold">{state.notice.text}</p>
              {state.notice.details && (
                <ul className="list-disc space-y-1 pl-5 text-sm">
                  {state.notice.details.map((message, i) => (
                    <li key={i}>{message}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </>
      )}

      {state.status === "preview" && (
        <div className="flex flex-col gap-4">
          <QuizPreview quiz={state.quiz} caption={state.fileName} note="아래 내용을 확인한 뒤 저장해 주세요." />

          {state.error && (
            <p role="alert" className="rounded-xl border border-red-300 bg-red-50 p-4 leading-relaxed text-red-900">
              {state.error}
            </p>
          )}

          <div className="flex flex-col gap-3 sm:flex-row-reverse">
            <button
              type="button"
              onClick={save}
              disabled={state.saving}
              className="min-h-14 flex-1 rounded-xl bg-blue-600 px-6 text-lg font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {state.saving ? "저장하는 중…" : "저장하기"}
            </button>
            <button
              type="button"
              onClick={cancel}
              disabled={state.saving}
              className="min-h-14 flex-1 rounded-xl border border-slate-300 bg-white px-6 text-lg font-semibold text-slate-700 hover:bg-slate-100"
            >
              취소
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
