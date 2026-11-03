import "server-only";
import { hasServerCredentials } from "@/lib/firebase/admin";

// 서버 창구의 공통 응답. 오류 문구는 화면에 그대로 보여줄 쉬운 한국어로 씁니다.

const NO_STORE = { "Cache-Control": "no-store" };
const MAX_BODY_BYTES = 1_000_000;

export function json(data: unknown, status = 200): Response {
  return Response.json(data, { status, headers: NO_STORE });
}

export function errorResponse(message: string, status: number, extra?: Record<string, unknown>) {
  return json({ error: message, ...extra }, status);
}

// 저장소에 연결할 서버 비밀키가 없으면 미리 알려줍니다.
export function missingCredentialsResponse(): Response | null {
  if (hasServerCredentials()) return null;
  return errorResponse(
    "서버가 아직 저장소(Firestore)에 연결되지 않았습니다. 관리자가 서버용 비밀키를 설정해야 합니다.",
    503,
  );
}

export function storageErrorResponse(error: unknown): Response {
  console.error("[firestore]", error);
  return errorResponse("저장소에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.", 500);
}

// 너무 큰 요청이나 JSON이 아닌 요청은 받지 않습니다.
export async function readJsonBody(request: Request): Promise<{ ok: true; body: unknown } | { ok: false; response: Response }> {
  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) {
    return { ok: false, response: errorResponse("보낸 내용이 너무 큽니다.", 413) };
  }
  try {
    return { ok: true, body: JSON.parse(text) };
  } catch {
    return { ok: false, response: errorResponse("보낸 내용을 읽을 수 없습니다.", 400) };
  }
}
