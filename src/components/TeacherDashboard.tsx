"use client";

import { useCallback, useEffect, useState } from "react";
import type { TeacherPaperSummary } from "@/lib/quiz/store";
import { teacherRequest } from "@/lib/api/client";
import PaperUploadPanel from "./PaperUploadPanel";
import ResultsPanel from "./ResultsPanel";

type ListState =
  | { status: "loading" }
  | { status: "ready"; papers: TeacherPaperSummary[] }
  | { status: "error"; message: string };

// 교사 화면 본문: 문제 등록, 등록한 문제지(공개/비공개), 문제지별 결과표
// 모든 요청은 서버가 허용된 교사인지 다시 확인한 뒤 처리합니다.
export default function TeacherDashboard() {
  const [list, setList] = useState<ListState>({ status: "loading" });
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toggleError, setToggleError] = useState<string | null>(null);
  const [resultsId, setResultsId] = useState<string | null>(null);

  const loadPapers = useCallback(async () => {
    const res = await teacherRequest<{ papers: TeacherPaperSummary[] }>("/api/teacher/papers");
    setList(res.ok ? { status: "ready", papers: res.data.papers } : { status: "error", message: res.error });
  }, []);

  useEffect(() => {
    // 처음 열 때 등록한 문제지 목록을 받아옵니다.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadPapers();
  }, [loadPapers]);

  const togglePublished = async (paper: TeacherPaperSummary) => {
    setBusyId(paper.id);
    setToggleError(null);
    const res = await teacherRequest(`/api/teacher/papers/${encodeURIComponent(paper.id)}`, {
      method: "PATCH",
      data: { published: !paper.published },
    });
    if (!res.ok) setToggleError(`공개 상태를 바꾸지 못했습니다("${paper.title}"). ${res.error}`);
    await loadPapers();
    setBusyId(null);
  };

  return (
    <>
      <PaperUploadPanel onSaved={loadPapers} />

      <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold">등록한 문제지</h2>
          <p className="leading-relaxed text-slate-600">
            [공개하기]를 누르면 학생 목록에 보이고, [비공개로 바꾸기]를 누르면 학생 목록에서 사라집니다.
          </p>
        </div>

        {toggleError && (
          <p role="alert" className="rounded-xl border border-red-300 bg-red-50 p-4 text-red-900">
            {toggleError}
          </p>
        )}

        {list.status === "loading" && <p className="text-slate-600">목록을 불러오고 있습니다…</p>}

        {list.status === "error" && (
          <div className="flex flex-col gap-3 rounded-xl border border-red-300 bg-red-50 p-4 text-red-900">
            <p>{list.message}</p>
            <button
              type="button"
              onClick={loadPapers}
              className="min-h-11 self-start rounded-lg border border-red-300 bg-white px-4 font-semibold hover:bg-red-100"
            >
              다시 불러오기
            </button>
          </div>
        )}

        {list.status === "ready" &&
          (list.papers.length === 0 ? (
            <p className="text-slate-600">아직 등록한 문제지가 없습니다. 위에서 JSON 파일을 올려 주세요.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {list.papers.map((paper) => (
                <li
                  key={paper.id}
                  className={`flex flex-col gap-3 rounded-xl border-2 p-4 ${
                    resultsId === paper.id ? "border-blue-400" : "border-slate-200"
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-lg font-semibold">{paper.title}</span>
                    <span className="text-slate-500">{paper.questionCount}문항</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-sm font-semibold ${
                        paper.published ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {paper.published ? "공개 중" : "비공개"}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => togglePublished(paper)}
                      disabled={busyId !== null}
                      className={`min-h-11 rounded-lg px-4 font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${
                        paper.published
                          ? "border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                          : "bg-blue-600 text-white hover:bg-blue-700"
                      }`}
                    >
                      {busyId === paper.id ? "바꾸는 중…" : paper.published ? "비공개로 바꾸기" : "공개하기"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setResultsId(paper.id)}
                      className="min-h-11 rounded-lg border border-slate-300 bg-white px-4 font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      결과 보기
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ))}
      </div>

      {resultsId ? (
        <ResultsPanel key={resultsId} paperId={resultsId} />
      ) : (
        <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-semibold">학생 풀이 결과</h2>
          <p className="text-slate-600">위 목록에서 [결과 보기]를 누르면 그 문제지의 결과표가 나옵니다.</p>
        </div>
      )}
    </>
  );
}
