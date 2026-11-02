import type { Answers, Question } from "@/lib/quiz/types";
import { unansweredNumbers } from "@/lib/quiz/score";

type Props = {
  questions: Question[];
  answers: Answers;
  index: number;
  onSelect: (choice: number) => void;
  onMove: (index: number) => void;
  onSubmit: () => void;
};

// 문제풀이: 한 화면에 한 문항. 정답 여부·점수·해설은 보여주지 않습니다.
export default function QuestionStep({
  questions,
  answers,
  index,
  onSelect,
  onMove,
  onSubmit,
}: Props) {
  const total = questions.length;
  const current = questions[index];
  const selected = answers[index];
  const isLast = index === total - 1;
  const missing = unansweredNumbers(answers);
  const canSubmit = missing.length === 0;

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-slate-600">
          <span className="text-lg font-semibold text-slate-900">
            {index + 1} / {total}
          </span>
          <span className="text-sm">답한 문제 {total - missing.length}개</span>
        </div>
        <div
          className="h-2 w-full overflow-hidden rounded-full bg-slate-200"
          role="progressbar"
          aria-label="진행률"
          aria-valuemin={1}
          aria-valuemax={total}
          aria-valuenow={index + 1}
        >
          <div
            className="h-full rounded-full bg-blue-600 transition-all"
            style={{ width: `${((index + 1) / total) * 100}%` }}
          />
        </div>
      </div>

      <h1 className="text-xl font-bold leading-relaxed">
        {index + 1}. {current.question}
      </h1>

      <div role="radiogroup" aria-label="보기" className="flex flex-col gap-3">
        {current.options.map((option, i) => {
          const choice = i + 1;
          const isSelected = selected === choice;
          return (
            <button
              key={i}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onSelect(choice)}
              className={`flex min-h-14 items-start gap-3 rounded-xl border-2 px-4 py-3 text-left text-lg leading-relaxed ${
                isSelected
                  ? "border-blue-600 bg-blue-50 font-semibold text-blue-900"
                  : "border-slate-200 bg-white hover:border-slate-400"
              }`}
            >
              <span
                className={`flex size-7 shrink-0 items-center justify-center rounded-full text-base ${
                  isSelected ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700"
                }`}
              >
                {choice}
              </span>
              <span>{option}</span>
            </button>
          );
        })}
      </div>

      {isLast && !canSubmit && (
        <p className="rounded-xl bg-amber-50 p-3 text-amber-900">
          {missing.join(", ")}번 문제에 아직 답하지 않았습니다. 모든 문제에 답해야 제출할 수 있습니다.
        </p>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => onMove(index - 1)}
          disabled={index === 0}
          className="min-h-14 flex-1 rounded-xl border border-slate-300 bg-white px-4 text-lg font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          이전
        </button>
        {isLast ? (
          <button
            type="button"
            onClick={onSubmit}
            disabled={!canSubmit}
            className="min-h-14 flex-1 rounded-xl bg-blue-600 px-4 text-lg font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
          >
            제출
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onMove(index + 1)}
            className="min-h-14 flex-1 rounded-xl bg-blue-600 px-4 text-lg font-semibold text-white hover:bg-blue-700"
          >
            다음
          </button>
        )}
      </div>
    </section>
  );
}
