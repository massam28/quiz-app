import "server-only";
import { verifyFirebaseIdToken } from "./firebaseToken";
import { isAllowedTeacher, readBearerToken, type TeacherCheck } from "./teacher";

export const TEACHER_CHECK_STATUS = {
  "no-token": 401,
  "invalid-token": 401,
  "not-allowed": 403,
  "not-configured": 500,
} as const;

// 교사 기능을 처리하는 서버 코드는 먼저 이 함수로 요청을 확인합니다.
export async function verifyTeacherRequest(request: Request): Promise<TeacherCheck> {
  const allowedEmail = process.env.TEACHER_EMAIL;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!allowedEmail || !projectId) {
    return { ok: false, reason: "not-configured" };
  }

  const idToken = readBearerToken(request.headers.get("authorization"));
  if (!idToken) return { ok: false, reason: "no-token" };

  let decoded;
  try {
    decoded = await verifyFirebaseIdToken(idToken, projectId);
  } catch {
    return { ok: false, reason: "invalid-token" };
  }

  if (!isAllowedTeacher(decoded, allowedEmail)) {
    return { ok: false, reason: "not-allowed", email: decoded.email };
  }
  return { ok: true, email: decoded.email! };
}

const TEACHER_ERROR = {
  "no-token": "교사 로그인이 필요합니다.",
  "invalid-token": "로그인 정보가 올바르지 않거나 만료되었습니다. 다시 로그인해 주세요.",
  "not-allowed": "허용되지 않은 계정입니다.",
  "not-configured": "서버의 교사 설정이 아직 없습니다.",
} as const;

// 교사 전용 서버 창구에서 씁니다. 허용된 교사가 아니면 바로 돌려보낼 응답을 줍니다.
export async function requireTeacher(
  request: Request,
): Promise<{ ok: true; email: string } | { ok: false; response: Response }> {
  const check = await verifyTeacherRequest(request);
  if (check.ok) return check;
  return {
    ok: false,
    response: Response.json(
      { error: TEACHER_ERROR[check.reason] },
      { status: TEACHER_CHECK_STATUS[check.reason], headers: { "Cache-Control": "no-store" } },
    ),
  };
}
