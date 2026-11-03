import { TEACHER_CHECK_STATUS, verifyTeacherRequest } from "@/lib/auth/verifyTeacher";

// 교사 화면이 열릴 때 서버에서 로그인 상태와 허용 계정인지 확인합니다.
export async function GET(request: Request) {
  const check = await verifyTeacherRequest(request);
  return Response.json(check, {
    status: check.ok ? 200 : TEACHER_CHECK_STATUS[check.reason],
    headers: { "Cache-Control": "no-store" },
  });
}
