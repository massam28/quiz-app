// 교사 확인 규칙. 화면과 서버가 함께 쓰며 Firebase에 직접 의존하지 않습니다.

export type TeacherCheck =
  | { ok: true; email: string }
  | { ok: false; reason: "no-token" | "invalid-token" | "not-allowed" | "not-configured"; email?: string };

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

// "Authorization: Bearer <토큰>" 머리글에서 토큰만 꺼냅니다.
export function readBearerToken(header: string | null): string | null {
  if (!header) return null;
  const match = /^Bearer\s+(\S+)$/i.exec(header.trim());
  return match ? match[1] : null;
}

// 허용 이메일 1개와 같고, Google이 확인한 이메일일 때만 교사로 인정합니다.
export function isAllowedTeacher(
  token: { email?: string; email_verified?: boolean },
  allowedEmail: string | undefined,
): boolean {
  if (!allowedEmail || !token.email || token.email_verified !== true) return false;
  return normalizeEmail(token.email) === normalizeEmail(allowedEmail);
}
