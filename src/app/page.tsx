import Link from "next/link";

// 첫 화면: 교사와 학생 중 하나를 고릅니다.
// 아직 로그인이 없어서 누구나 두 버튼을 모두 누를 수 있습니다.
export default function Home() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:py-12">
      <section className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold">문제풀이</h1>
          <p className="text-lg leading-relaxed text-slate-700">어떻게 시작할지 골라 주세요.</p>
        </div>

        <div className="flex flex-col gap-3">
          <Link
            href="/teacher"
            className="flex min-h-16 flex-col justify-center gap-1 rounded-xl border-2 border-slate-200 bg-white px-5 py-4 hover:border-blue-500 hover:bg-blue-50"
          >
            <span className="text-lg font-semibold">교사로 시작하기</span>
            <span className="text-slate-500">문제를 등록하고 학생들의 풀이 결과를 확인합니다.</span>
          </Link>
          <Link
            href="/student"
            className="flex min-h-16 flex-col justify-center gap-1 rounded-xl border-2 border-slate-200 bg-white px-5 py-4 hover:border-blue-500 hover:bg-blue-50"
          >
            <span className="text-lg font-semibold">학생으로 시작하기</span>
            <span className="text-slate-500">이름을 입력하고 문제를 풉니다.</span>
          </Link>
        </div>
      </section>
    </main>
  );
}
