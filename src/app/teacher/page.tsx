import Link from "next/link";

// 교사 화면: 지금은 기본 구조만 있습니다.
// Google 로그인, 문제 등록, 결과 저장은 다음 단계에서 연결합니다.
export default function TeacherPage() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:py-12">
      <section className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <p className="text-slate-500">교사</p>
          <h1 className="text-2xl font-bold">교사 화면</h1>
        </div>

        <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-semibold">문제 등록</h2>
          <p className="leading-relaxed text-slate-600">
            학생들이 풀 문제를 등록하는 곳입니다. 다음 단계에서 연결됩니다.
          </p>
        </div>

        <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-semibold">학생 풀이 결과</h2>
          <p className="leading-relaxed text-slate-600">
            학생들의 점수와 정답 여부를 확인하는 곳입니다. 아직 풀이 결과를 저장하지 않아서 보여줄
            내용이 없습니다. 다음 단계에서 연결됩니다.
          </p>
        </div>

        <Link
          href="/"
          className="flex min-h-14 items-center justify-center rounded-xl border border-slate-300 bg-white px-6 text-lg font-semibold text-slate-700 hover:bg-slate-100"
        >
          첫 화면으로
        </Link>
      </section>
    </main>
  );
}
