"use client";

import { useRef, useState, type ChangeEvent } from "react";
import type { QuizFile } from "@/lib/quiz/types";
import { checkPdfFile } from "@/lib/ai/limits";
import { teacherRequest } from "@/lib/api/client";
import QuizPreview from "./QuizPreview";

type Props = {
  onSaved: () => void;
};

// 교사: PDF 올리기 → AI 생성(중복 실행 불가) → 제목·10문항·정답·해설 확인 → [저장](바로 공개) 또는 [취소]
// 생성된 내용을 고치거나 다시 만드는 버튼은 두지 않습니다.
type State =
  | { status: "idle"; notice?: { kind: "success" | "error"; text: string } }
  | { status: "generating"; file: File }
  | { status: "failed"; file: File; message: string }
  | { status: "review"; quiz: QuizFile; fileName: string; saving: boolean; error?: string };

export default function AiGeneratePanel({ onSaved }: Props) {
  const [state, setState] = useState<State>({ status: "idle" });
  const inputRef = useRef<HTMLInputElement>(null);

  const resetInput = () => {
    if (inputRef.current) inputRef.current.value = "";
  };

  const generate = async (file: File) => {
    setState({ status: "generating", file });
    const form = new FormData();
    form.append("file", file);
    const res = await teacherRequest<{ quiz: QuizFile }>("/api/teacher/ai/generate", {
      method: "POST",
      form,
    });
    if (!res.ok) {
      setState({ status: "failed", file, message: res.error });
      return;
    }
    setState({ status: "review", quiz: res.data.quiz, fileName: file.name, saving: false });
  };

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || state.status === "generating") return;
    const check = checkPdfFile(file);
    if (!check.ok) {
      setState({ status: "idle", notice: { kind: "error", text: `${file.name}: ${check.message}` } });
      resetInput();
      return;
    }
    generate(file);
  };

  const save = async () => {
    if (state.status !== "review" || state.saving) return;
    const current = state;
    setState({ ...current, saving: true, error: undefined });
    const res = await teacherRequest<{ id: string }>("/api/teacher/ai/save", {
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
      notice: { kind: "success", text: `저장하고 학생에게 공개했습니다: "${current.quiz.title}"` },
    });
    onSaved();
  };

  const backToUpload = () => {
    resetInput();
    setState({ status: "idle" });
  };

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold">PDF로 AI 문제 만들기</h2>
        <p className="leading-relaxed text-slate-600">
          학습자료 PDF를 올리면 AI가 제목과 4지선다 10문항(정답·해설 포함)을 만듭니다. 확인한 뒤 [저장]하면 바로 학생에게
          공개됩니다.
        </p>
        <p className="text-sm leading-relaxed text-slate-500">
          글자를 선택·복사할 수 있는 PDF만 가능합니다(스캔·사진 PDF 불가). 파일 512KB 이하, 본문 12,000자 이하.
        </p>
      </div>

      {state.status === "idle" && (
        <>
          <label className="flex min-h-14 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-slate-300 px-4 text-center font-semibold text-slate-700 hover:border-blue-500 hover:bg-blue-50">
            PDF 파일 고르기
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFile}
              className="sr-only"
            />
          </label>
          {state.notice && (
            <p
              role={state.notice.kind === "error" ? "alert" : "status"}
              className={`rounded-xl border p-4 font-semibold leading-relaxed ${
                state.notice.kind === "error"
                  ? "border-red-300 bg-red-50 text-red-900"
                  : "border-green-300 bg-green-50 text-green-900"
              }`}
            >
              {state.notice.text}
            </p>
          )}
        </>
      )}

      {state.status === "generating" && (
        <div role="status" className="flex flex-col gap-1 rounded-xl border border-blue-200 bg-blue-50 p-4 text-blue-900">
          <p className="font-semibold">AI가 문제를 만들고 있습니다… (1~2분 걸릴 수 있습니다)</p>
          <p className="text-sm">{state.file.name} · 이 화면을 닫지 말고 기다려 주세요.</p>
        </div>
      )}

      {state.status === "failed" && (
        <div className="flex flex-col gap-3">
          <p role="alert" className="rounded-xl border border-red-300 bg-red-50 p-4 leading-relaxed text-red-900">
            {state.message}
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => generate(state.file)}
              className="min-h-12 flex-1 rounded-xl bg-blue-600 px-4 font-semibold text-white hover:bg-blue-700"
            >
              다시 시도
            </button>
            <button
              type="button"
              onClick={backToUpload}
              className="min-h-12 flex-1 rounded-xl border border-slate-300 bg-white px-4 font-semibold text-slate-700 hover:bg-slate-100"
            >
              다른 파일 고르기
            </button>
          </div>
        </div>
      )}

      {state.status === "review" && (
        <div className="flex flex-col gap-4">
          <QuizPreview
            quiz={state.quiz}
            caption={`${state.fileName}에서 AI가 만든 문제지`}
            note="형식 검사만 통과했습니다. 내용이 PDF와 맞는지는 직접 확인해 주세요."
          />

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
              {state.saving ? "저장하는 중…" : "저장"}
            </button>
            <button
              type="button"
              onClick={backToUpload}
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
