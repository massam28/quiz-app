// 교사 화면 본문: 지금은 기본 구조만 있습니다.
// 문제 등록과 결과 저장·조회는 다음 단계에서 연결합니다.
export default function TeacherDashboard() {
  return (
    <>
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
    </>
  );
}
