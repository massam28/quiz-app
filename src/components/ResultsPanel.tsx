"use client";

import { useCallback, useEffect, useState } from "react";
import { formatScore } from "@/lib/quiz/score";
import type { PaperSummary, ResultRow } from "@/lib/quiz/store";
import { teacherRequest } from "@/lib/api/client";

type Props = {
  paperId: string;
};

type ResultsData = { paper: PaperSummary; rows: ResultRow[]; average: number | null };

type State =
  | { status: "loading" }
  | { status: "ready"; data: ResultsData }
  | { status: "error"; message: string };

function formatTime(iso: string | null): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("ko-KR", { dateStyle: "short", timeStyle: "short" });
}

// 교사: 문제지별 결과표. 학생 이름별 최신 완료 결과와 평균을 보여줍니다.
export default function ResultsPanel({ paperId }: Props) {
  const [state, setState] = useState<State>({ status: "loading" });

  const load = useCallback(async () => {
    setState({ status: "loading" });
    const res = await teacherRequest<ResultsData>(
      `/api/teacher/papers/${encodeURIComponent(paperId)}/results`,
    );
    setState(res.ok ? { status: "ready", data: res.data } : { status: "error", message: res.error });
  }, [paperId]);

  useEffect(() => {
    // 문제지를 고를 때마다 서버에서 결과표를 받아옵니다.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">학생 풀이 결과</h2>
        <button
          type="button"
          onClick={load}
          className="min-h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
        >
          새로고침
        </button>
      </div>

      {state.status === "loading" && <p className="text-slate-600">결과를 불러오고 있습니다…</p>}

      {state.status === "error" && (
        <p role="alert" className="rounded-xl border border-red-300 bg-red-50 p-4 text-red-900">
          {state.message}
        </p>
      )}

      {state.status === "ready" && (
        <>
          <div className="flex flex-wrap gap-x-6 gap-y-1 rounded-xl bg-slate-50 p-4">
            <p className="w-full text-lg font-bold">{state.data.paper.title}</p>
            <p className="text-slate-700">응시 학생 {state.data.rows.length}명</p>
            <p className="text-slate-700">
              평균 점수{" "}
              <span className="font-semibold text-slate-900">
                {state.data.average === null ? "-" : `${formatScore(state.data.average)}점`}
              </span>
            </p>
            <p className="w-full text-sm text-slate-500">
              같은 이름으로 다시 푼 경우 가장 최근 결과만 표에 나오고 평균에 들어갑니다.
            </p>
          </div>

          {state.data.rows.length === 0 ? (
            <p className="text-slate-600">아직 이 문제지를 제출한 학생이 없습니다.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[28rem] border-collapse text-left">
                <thead>
                  <tr className="border-b-2 border-slate-200 text-sm text-slate-500">
                    <th scope="col" className="py-2 pr-3 font-semibold">이름</th>
                    <th scope="col" className="py-2 pr-3 font-semibold">점수</th>
                    <th scope="col" className="py-2 pr-3 font-semibold">틀린 문제</th>
                    <th scope="col" className="py-2 font-semibold">제출 시각</th>
                  </tr>
                </thead>
                <tbody>
                  {state.data.rows.map((row) => (
                    <tr key={row.studentName} className="border-b border-slate-100">
                      <td className="py-2 pr-3 font-semibold">{row.studentName}</td>
                      <td className="py-2 pr-3">{formatScore(row.score)}점</td>
                      <td className="py-2 pr-3">
                        {row.wrongQuestions.length === 0 ? "없음" : `${row.wrongQuestions.join(", ")}번`}
                      </td>
                      <td className="py-2 text-sm text-slate-600">{formatTime(row.submittedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
