import { requireTeacher } from "@/lib/auth/verifyTeacher";
import {
  errorResponse,
  json,
  missingCredentialsResponse,
  readJsonBody,
  storageErrorResponse,
} from "@/lib/api/respond";
import { setPaperPublished } from "@/lib/quiz/store";

// 교사: 공개 / 비공개 바꾸기
export async function PATCH(request: Request, ctx: RouteContext<"/api/teacher/papers/[id]">) {
  const teacher = await requireTeacher(request);
  if (!teacher.ok) return teacher.response;
  const missing = missingCredentialsResponse();
  if (missing) return missing;

  const { id } = await ctx.params;
  const body = await readJsonBody(request);
  if (!body.ok) return body.response;
  const published = (body.body as { published?: unknown } | null)?.published;
  if (typeof published !== "boolean") {
    return errorResponse("공개 여부를 알 수 없습니다.", 400);
  }

  try {
    const found = await setPaperPublished(id, published);
    if (!found) return errorResponse("문제지를 찾을 수 없습니다.", 404);
    return json({ id, published });
  } catch (error) {
    return storageErrorResponse(error);
  }
}
