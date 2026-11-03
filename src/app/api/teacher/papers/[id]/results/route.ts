import { requireTeacher } from "@/lib/auth/verifyTeacher";
import {
  errorResponse,
  json,
  missingCredentialsResponse,
  storageErrorResponse,
} from "@/lib/api/respond";
import { getPaperSummary, listResults } from "@/lib/quiz/store";

// 교사: 문제지별 학생 결과표(이름별 최신 결과)와 평균
export async function GET(request: Request, ctx: RouteContext<"/api/teacher/papers/[id]/results">) {
  const teacher = await requireTeacher(request);
  if (!teacher.ok) return teacher.response;
  const missing = missingCredentialsResponse();
  if (missing) return missing;

  const { id } = await ctx.params;
  try {
    const paper = await getPaperSummary(id);
    if (!paper) return errorResponse("문제지를 찾을 수 없습니다.", 404);
    const { rows, average } = await listResults(id);
    return json({ paper, rows, average });
  } catch (error) {
    return storageErrorResponse(error);
  }
}
