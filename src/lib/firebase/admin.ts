import "server-only";
import { applicationDefault, cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

// 서버용 Firebase 연결. 비밀키는 코드에 넣지 않고 아래 둘 중 하나로 받습니다.
// - 내 컴퓨터: .env.local의 GOOGLE_APPLICATION_CREDENTIALS(비밀키 파일 위치)
// - Vercel 등: FIREBASE_SERVICE_ACCOUNT_JSON(비밀키 파일 내용, 서비스 설정 화면에서 입력)
function adminApp() {
  const existing = getApps()[0];
  if (existing) return existing;
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  return initializeApp({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    credential: json ? cert(JSON.parse(json)) : applicationDefault(),
  });
}

export function hasServerCredentials(): boolean {
  return Boolean(
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON || process.env.GOOGLE_APPLICATION_CREDENTIALS,
  );
}

// 로그인 토큰 확인은 비밀키 없이도 됩니다(프로젝트 ID만 필요).
export function adminAuth() {
  return getAuth(adminApp());
}

export function adminDb() {
  return getFirestore(adminApp());
}
