import {
  errorResponse,
  json,
  missingCredentialsResponse,
  storageErrorResponse,
} from "@/lib/api/respond";
import { toStudentQuestions } from "@/lib/quiz/records";
import { getPublishedPaper } from "@/lib/quiz/store";

// 학생: 공개된 문제지의 문제와 보기. 정답과 해설은 보내지 않습니다.
export async function GET(_request: Request, ctx: RouteContext<"/api/papers/[id]">) {
  const missing = missingCredentialsResponse();
  if (missing) return missing;

  const { id } = await ctx.params;
  try {
    const paper = await getPublishedPaper(id);
    if (!paper) return errorResponse("이 문제지는 지금 풀 수 없습니다. 목록에서 다시 골라 주세요.", 404);
    return json({ id: paper.id, title: paper.title, questions: toStudentQuestions(paper.questions) });
  } catch (error) {
    return storageErrorResponse(error);
  }
}
