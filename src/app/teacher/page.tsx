import TeacherApp from "@/components/TeacherApp";

// 교사 화면: 허용된 교사 Google 계정으로 로그인해야 본문이 보입니다.
export default function TeacherPage() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:py-12">
      <TeacherApp />
    </main>
  );
}
