import {
  errorResponse,
  json,
  missingCredentialsResponse,
  readJsonBody,
  storageErrorResponse,
} from "@/lib/api/respond";
import { normalizeStudentName, parseSubmittedAnswers, STUDENT_NAME_MAX } from "@/lib/quiz/records";
import { gradeAndSaveResult, getPublishedPaper } from "@/lib/quiz/store";

// 학생: 최종 제출. 서버에서 채점하고 저장한 뒤에만 점수·정답·해설을 돌려줍니다.
export async function POST(request: Request, ctx: RouteContext<"/api/papers/[id]/submit">) {
  const missing = missingCredentialsResponse();
  if (missing) return missing;

  const { id } = await ctx.params;
  const body = await readJsonBody(request);
  if (!body.ok) return body.response;
  const { studentName, answers } = (body.body ?? {}) as { studentName?: unknown; answers?: unknown };

  const name = typeof studentName === "string" ? normalizeStudentName(studentName) : "";
  if (name === "" || name.length > STUDENT_NAME_MAX) {
    return errorResponse(`이름은 1~${STUDENT_NAME_MAX}글자로 입력해 주세요.`, 400);
  }

  try {
    const paper = await getPublishedPaper(id);
    if (!paper) return errorResponse("이 문제지는 지금 제출할 수 없습니다. 교사가 공개를 취소했을 수 있습니다.", 404);

    const parsed = parseSubmittedAnswers(answers, paper.questions.length);
    if (!parsed) return errorResponse("모든 문제에 답한 뒤 제출해 주세요.", 400);

    const grade = await gradeAndSaveResult(paper, name, parsed);
    return json({ grade });
  } catch (error) {
    return storageErrorResponse(error);
  }
}
