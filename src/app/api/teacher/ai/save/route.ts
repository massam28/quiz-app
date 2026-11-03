import { requireTeacher } from "@/lib/auth/verifyTeacher";
import {
  errorResponse,
  json,
  missingCredentialsResponse,
  readJsonBody,
  storageErrorResponse,
} from "@/lib/api/respond";
import { validateGeneratedQuiz } from "@/lib/ai/limits";
import { createPaper } from "@/lib/quiz/store";

// 교사: AI가 만든 문제지 저장. 화면을 거쳐 온 값이므로 다시 검사하고, 저장과 동시에 학생에게 공개합니다.
export async function POST(request: Request) {
  const teacher = await requireTeacher(request);
  if (!teacher.ok) return teacher.response;
  const missing = missingCredentialsResponse();
  if (missing) return missing;

  const body = await readJsonBody(request);
  if (!body.ok) return body.response;

  const check = validateGeneratedQuiz(body.body);
  if (!check.ok) {
    return errorResponse("저장할 수 없는 문제지입니다.", 400, { details: check.errors });
  }

  try {
    const result = await createPaper(check.quiz, teacher.email, { published: true, source: "ai" });
    if (!result.ok) {
      const message =
        result.reason === "duplicate-title"
          ? `같은 제목의 문제지가 이미 등록되어 있어 저장하지 않았습니다: "${result.existingTitle}". [취소]를 누르고 다시 만들어 주세요.`
          : `문항 내용이 똑같은 문제지가 이미 등록되어 있어 저장하지 않았습니다: "${result.existingTitle}".`;
      return errorResponse(message, 409);
    }
    return json({ id: result.id }, 201);
  } catch (error) {
    return storageErrorResponse(error);
  }
}
