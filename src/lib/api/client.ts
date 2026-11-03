import { getFirebaseAuth } from "@/lib/firebase/client";

// 화면에서 서버 창구를 부를 때 씁니다. 실패하면 화면에 보여줄 한국어 문구를 돌려줍니다.

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string; details?: string[] };

const NETWORK_ERROR = "서버에 연결하지 못했습니다. 인터넷 연결을 확인하고 다시 시도해 주세요.";

export async function requestJson<T>(path: string, init?: RequestInit): Promise<ApiResult<T>> {
  let res: Response;
  try {
    res = await fetch(path, { cache: "no-store", ...init });
  } catch {
    return { ok: false, error: NETWORK_ERROR };
  }
  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }
  if (res.ok) return { ok: true, data: body as T };
  const { error, details } = (body ?? {}) as { error?: string; details?: string[] };
  return { ok: false, error: error ?? "요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.", details };
}

export function postJson<T>(path: string, data: unknown, method = "POST"): Promise<ApiResult<T>> {
  return requestJson<T>(path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

// 교사 전용 창구: 로그인 토큰을 붙여 보냅니다. 서버가 다시 허용 계정인지 확인합니다.
// 파일을 보낼 때는 form(FormData)을 씁니다.
export async function teacherRequest<T>(
  path: string,
  init: { method?: string; data?: unknown; form?: FormData } = {},
): Promise<ApiResult<T>> {
  const user = getFirebaseAuth().currentUser;
  if (!user) return { ok: false, error: "교사 로그인이 필요합니다." };
  const idToken = await user.getIdToken();
  const headers: Record<string, string> = { Authorization: `Bearer ${idToken}` };
  let body: BodyInit | undefined;
  if (init.form) {
    body = init.form;
  } else if (init.data !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(init.data);
  }
  return requestJson<T>(path, { method: init.method ?? "GET", headers, body });
}
