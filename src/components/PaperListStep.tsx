import type { QuestionPaper, QuizFile } from "@/lib/quiz/types";

type Props = {
  papers: QuestionPaper[];
  onSelect: (quiz: QuizFile) => void;
};

// 홈: question-papers 폴더의 문제지 목록. 제목은 각 파일의 title에서 읽습니다.
export default function PaperListStep({ papers, onSelect }: Props) {
  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">문제풀이</h1>
        <p className="text-lg leading-relaxed text-slate-700">풀고 싶은 문제지를 골라 주세요.</p>
      </div>

      {papers.length === 0 ? (
        <p className="rounded-xl border border-slate-200 bg-white p-4 text-slate-700">
          아직 준비된 문제지가 없습니다.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {papers.map((paper) => (
            <li key={paper.fileName}>
              {paper.ok ? (
                <button
                  type="button"
                  onClick={() => onSelect(paper.quiz)}
                  className="flex min-h-16 w-full items-center justify-between gap-3 rounded-xl border-2 border-slate-200 bg-white px-5 py-4 text-left hover:border-blue-500 hover:bg-blue-50"
                >
                  <span className="text-lg font-semibold">{paper.quiz.title}</span>
                  <span className="shrink-0 text-slate-500">
                    {paper.quiz.questions.length}문항
                  </span>
                </button>
              ) : (
                <div className="flex flex-col gap-2 rounded-xl border border-red-300 bg-red-50 p-4 text-red-900">
                  <p className="font-semibold">
                    {paper.fileName}: 형식이 올바르지 않아 풀 수 없습니다.
                  </p>
                  <ul className="list-disc space-y-1 pl-5 text-sm">
                    {paper.errors.map((message, i) => (
                      <li key={i}>{message}</li>
                    ))}
                  </ul>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
