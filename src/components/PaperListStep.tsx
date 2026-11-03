import type { PaperSummary } from "@/lib/quiz/store";

type Props = {
  list:
    | { status: "loading" }
    | { status: "ready"; papers: PaperSummary[] }
    | { status: "error"; message: string };
  openError: string | null;
  onSelect: (id: string) => void;
  onReload: () => void;
};

// 학생 문제지 목록: 교사가 공개한 문제지만 보입니다.
export default function PaperListStep({ list, openError, onSelect, onReload }: Props) {
  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">문제풀이</h1>
        <p className="text-lg leading-relaxed text-slate-700">풀고 싶은 문제지를 골라 주세요.</p>
      </div>

      {openError && (
        <p role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-900">
          {openError}
        </p>
      )}

      {list.status === "loading" && (
        <p className="rounded-xl border border-slate-200 bg-white p-4 text-slate-700">
          문제지 목록을 불러오고 있습니다…
        </p>
      )}

      {list.status === "error" && (
        <div className="flex flex-col gap-3 rounded-xl border border-red-300 bg-red-50 p-4 text-red-900">
          <p>{list.message}</p>
          <button
            type="button"
            onClick={onReload}
            className="min-h-11 self-start rounded-lg border border-red-300 bg-white px-4 font-semibold hover:bg-red-100"
          >
            다시 불러오기
          </button>
        </div>
      )}

      {list.status === "ready" &&
        (list.papers.length === 0 ? (
          <p className="rounded-xl border border-slate-200 bg-white p-4 text-slate-700">
            아직 공개된 문제지가 없습니다. 선생님이 문제지를 공개하면 여기에 보입니다.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {list.papers.map((paper) => (
              <li key={paper.id}>
                <button
                  type="button"
                  onClick={() => onSelect(paper.id)}
                  className="flex min-h-16 w-full items-center justify-between gap-3 rounded-xl border-2 border-slate-200 bg-white px-5 py-4 text-left hover:border-blue-500 hover:bg-blue-50"
                >
                  <span className="text-lg font-semibold">{paper.title}</span>
                  <span className="shrink-0 text-slate-500">{paper.questionCount}문항</span>
                </button>
              </li>
            ))}
          </ul>
        ))}
    </section>
  );
}
