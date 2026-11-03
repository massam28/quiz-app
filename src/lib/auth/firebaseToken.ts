import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from "jose";

// Firebase 로그인 토큰(ID 토큰) 확인. Firebase 공식 문서의 "타사 JWT 라이브러리로 ID 토큰 확인" 방법을 따릅니다.
// firebase-admin/auth는 Vercel 서버에서 불러오지 못해(jwks-rsa가 jose를 require로 불러 ERR_REQUIRE_ESM) 쓰지 않습니다.

const GOOGLE_KEYS_URL =
  "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com";

let googleKeys: JWTVerifyGetKey | null = null;

export type FirebaseTokenClaims = {
  sub: string;
  email?: string;
  email_verified?: boolean;
};

// 서명·발급자·대상·만료를 확인하고, 문제가 있으면 오류를 던집니다.
export async function verifyFirebaseIdToken(
  idToken: string,
  projectId: string,
  keys: JWTVerifyGetKey = (googleKeys ??= createRemoteJWKSet(new URL(GOOGLE_KEYS_URL))),
): Promise<FirebaseTokenClaims> {
  const { payload } = await jwtVerify(idToken, keys, {
    algorithms: ["RS256"],
    issuer: `https://securetoken.google.com/${projectId}`,
    audience: projectId,
    clockTolerance: 5,
  });
  const now = Math.floor(Date.now() / 1000) + 5;
  if (typeof payload.sub !== "string" || payload.sub === "") throw new Error("token has no subject");
  if (typeof payload.iat !== "number" || payload.iat > now) throw new Error("token issued in the future");
  if (typeof payload.auth_time !== "number" || payload.auth_time > now) throw new Error("invalid auth_time");
  return {
    sub: payload.sub,
    email: typeof payload.email === "string" ? payload.email : undefined,
    email_verified: payload.email_verified === true,
  };
}
