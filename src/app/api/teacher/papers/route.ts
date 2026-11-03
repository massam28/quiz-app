import { requireTeacher } from "@/lib/auth/verifyTeacher";
import {
  errorResponse,
  json,
  missingCredentialsResponse,
  readJsonBody,
  storageErrorResponse,
} from "@/lib/api/respond";
import { parseQuizFile } from "@/lib/quiz/validate";
import { createPaper, listPapersForTeacher } from "@/lib/quiz/store";

// 교사: 등록한 문제지 목록
export async function GET(request: Request) {
  const teacher = await requireTeacher(request);
  if (!teacher.ok) return teacher.response;
  const missing = missingCredentialsResponse();
  if (missing) return missing;

  try {
    return json({ papers: await listPapersForTeacher() });
  } catch (error) {
    return storageErrorResponse(error);
  }
}

// 교사: 문제지 등록(비공개로 저장). 화면에서 검사했더라도 서버에서 다시 검사합니다.
export async function POST(request: Request) {
  const teacher = await requireTeacher(request);
  if (!teacher.ok) return teacher.response;
  const missing = missingCredentialsResponse();
  if (missing) return missing;

  const body = await readJsonBody(request);
  if (!body.ok) return body.response;

  const parsed = parseQuizFile(JSON.stringify(body.body));
  if (!parsed.ok) {
    return errorResponse("문제지 형식이 올바르지 않습니다.", 400, { details: parsed.errors });
  }

  try {
    const result = await createPaper(parsed.quiz, teacher.email);
    if (!result.ok) {
      const message =
        result.reason === "duplicate-title"
          ? `같은 제목의 문제지가 이미 등록되어 있습니다: "${result.existingTitle}". 제목을 바꾸거나 기존 문제지를 사용해 주세요.`
          : `문항 내용이 똑같은 문제지가 이미 등록되어 있습니다: "${result.existingTitle}".`;
      return errorResponse(message, 409);
    }
    return json({ id: result.id }, 201);
  } catch (error) {
    return storageErrorResponse(error);
  }
}
