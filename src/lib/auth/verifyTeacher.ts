import "server-only";
import { getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { isAllowedTeacher, readBearerToken, type TeacherCheck } from "./teacher";

// 로그인 토큰 확인에는 프로젝트 ID만 필요합니다(비밀키 없음).
function adminAuth() {
  const app =
    getApps()[0] ?? initializeApp({ projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID });
  return getAuth(app);
}

// 교사 기능을 처리하는 서버 코드는 먼저 이 함수로 요청을 확인합니다.
export async function verifyTeacherRequest(request: Request): Promise<TeacherCheck> {
  const allowedEmail = process.env.TEACHER_EMAIL;
  if (!allowedEmail || !process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
    return { ok: false, reason: "not-configured" };
  }

  const idToken = readBearerToken(request.headers.get("authorization"));
  if (!idToken) return { ok: false, reason: "no-token" };

  let decoded;
  try {
    decoded = await adminAuth().verifyIdToken(idToken);
  } catch {
    return { ok: false, reason: "invalid-token" };
  }

  if (!isAllowedTeacher(decoded, allowedEmail)) {
    return { ok: false, reason: "not-allowed", email: decoded.email };
  }
  return { ok: true, email: decoded.email! };
}
