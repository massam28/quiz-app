import StudentApp from "@/components/StudentApp";
import { loadQuestionPapers } from "@/lib/quiz/papers";

export default function StudentPage() {
  const papers = loadQuestionPapers();
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:py-12">
      <StudentApp papers={papers} />
    </main>
  );
}
