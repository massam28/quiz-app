import type { QuizFile } from "@/lib/quiz/types";

type Props = {
  quiz: QuizFile;
  caption?: string;
  note: string;
};

// 교사용 문제지 미리보기: 제목, 전체 문항, 보기, 정답, 해설
export default function QuizPreview({ quiz, caption, note }: Props) {
  return (
    <>
      <div className="flex flex-col gap-1 rounded-xl bg-slate-50 p-4">
        {caption && <p className="text-sm text-slate-500">{caption}</p>}
        <p className="text-xl font-bold">{quiz.title}</p>
        <p className="text-slate-700">
          총 {quiz.questions.length}문항 · {note}
        </p>
      </div>

      <ol className="flex max-h-96 flex-col gap-3 overflow-y-auto pr-1">
        {quiz.questions.map((q, i) => (
          <li key={i} className="flex flex-col gap-2 rounded-xl border border-slate-200 p-3">
            <p className="font-semibold leading-relaxed">
              {i + 1}. {q.question}
            </p>
            <ol className="flex flex-col gap-1 text-slate-700">
              {q.options.map((option, j) => (
                <li
                  key={j}
                  className={j + 1 === q.correctAnswer ? "font-semibold text-green-800" : undefined}
                >
                  {j + 1}. {option}
                  {j + 1 === q.correctAnswer && " (정답)"}
                </li>
              ))}
            </ol>
            <p className="rounded-lg bg-slate-50 p-2 text-sm leading-relaxed text-slate-700">
              <span className="font-semibold">해설 </span>
              {q.explanation}
            </p>
          </li>
        ))}
      </ol>
    </>
  );
}
