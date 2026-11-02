import type { GradeResult } from "@/lib/quiz/score";
import { formatScore } from "@/lib/quiz/score";

type Props = {
  grade: GradeResult;
  onRetry: () => void;
  onChangePaper: () => void;
};

function optionText(options: string[], choice: number | null) {
  return choice === null ? "선택 안 함" : `${choice}. ${options[choice - 1]}`;
}

// 최종 결과: 총점, 문항별 정오·내가 고른 답·정답·해설
export default function ResultStep({ grade, onRetry, onChangePaper }: Props) {
  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-1 rounded-2xl bg-blue-600 p-6 text-white">
        <p className="text-lg">내 점수</p>
        <p className="text-5xl font-bold">{formatScore(grade.score)}점</p>
        <p className="text-lg">
          {grade.total}문항 중 {grade.correctCount}문항 정답
        </p>
      </div>

      <ol className="flex flex-col gap-4">
        {grade.results.map((r, i) => (
          <li
            key={i}
            className={`flex flex-col gap-3 rounded-xl border-2 bg-white p-4 ${
              r.isCorrect ? "border-green-300" : "border-red-300"
            }`}
          >
            <div className="flex items-start gap-3">
              <span
                aria-label={r.isCorrect ? "정답" : "오답"}
                className={`flex size-9 shrink-0 items-center justify-center rounded-full text-xl font-bold text-white ${
                  r.isCorrect ? "bg-green-600" : "bg-red-600"
                }`}
              >
                {r.isCorrect ? "○" : "×"}
              </span>
              <p className="font-semibold leading-relaxed">
                {i + 1}. {r.question.question}
              </p>
            </div>
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
              <dt className="text-slate-500">내가 고른 답</dt>
              <dd className={r.isCorrect ? "text-green-800" : "text-red-800"}>
                {optionText(r.question.options, r.selected)}
              </dd>
              <dt className="text-slate-500">정답</dt>
              <dd className="font-semibold">
                {optionText(r.question.options, r.question.correctAnswer)}
              </dd>
            </dl>
            <p className="rounded-lg bg-slate-50 p-3 leading-relaxed text-slate-800">
              <span className="font-semibold">해설 </span>
              {r.question.explanation}
            </p>
          </li>
        ))}
      </ol>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={onRetry}
          className="min-h-14 flex-1 rounded-xl bg-blue-600 px-6 text-lg font-semibold text-white hover:bg-blue-700"
        >
          다시 풀기
        </button>
        <button
          type="button"
          onClick={onChangePaper}
          className="min-h-14 flex-1 rounded-xl border border-slate-300 bg-white px-6 text-lg font-semibold text-slate-700 hover:bg-slate-100"
        >
          다른 문제지 고르기
        </button>
      </div>
    </section>
  );
}
