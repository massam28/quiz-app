import type { Question } from "@/lib/quiz/types";

type Props = {
  questions: Question[];
  fileName: string;
  onStart: () => void;
  onChangeFile: () => void;
};

// 문항 확인: 문항 수와 문제 글만 보여주고 보기·정답은 숨깁니다.
export default function ReviewStep({ questions, fileName, onStart, onChangeFile }: Props) {
  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <p className="text-sm text-slate-500">{fileName}</p>
        <h1 className="text-2xl font-bold">총 {questions.length}문항</h1>
        <p className="text-slate-700">아래 문제를 순서대로 풉니다. 준비되면 [풀이 시작]을 눌러 주세요.</p>
      </div>

      <ol className="flex flex-col gap-2">
        {questions.map((q, i) => (
          <li key={i} className="flex gap-3 rounded-xl border border-slate-200 bg-white p-3">
            <span className="shrink-0 font-semibold text-blue-700">{i + 1}.</span>
            <span className="leading-relaxed">{q.question}</span>
          </li>
        ))}
      </ol>

      <div className="flex flex-col gap-3 sm:flex-row-reverse">
        <button
          type="button"
          onClick={onStart}
          className="min-h-14 flex-1 rounded-xl bg-blue-600 px-6 text-lg font-semibold text-white hover:bg-blue-700"
        >
          풀이 시작
        </button>
        <button
          type="button"
          onClick={onChangeFile}
          className="min-h-14 flex-1 rounded-xl border border-slate-300 bg-white px-6 text-lg font-semibold text-slate-700 hover:bg-slate-100"
        >
          다른 파일 올리기
        </button>
      </div>
    </section>
  );
}
