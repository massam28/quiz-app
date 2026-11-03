import { requireTeacher } from "@/lib/auth/verifyTeacher";
import { errorResponse, json, missingCredentialsResponse, storageErrorResponse } from "@/lib/api/respond";
import { checkPdfFile, PDF_MAX_BYTES } from "@/lib/ai/limits";
import { readPdfText } from "@/lib/ai/pdfText";
import { generateQuizWithAzure, readAzureConfig } from "@/lib/ai/azureQuiz";
import { listPapersForTeacher } from "@/lib/quiz/store";

// AI 응답 대기(최대 90초)를 포함한 이 요청의 최대 실행 시간
export const maxDuration = 120;

// 양식 머리글 등 파일 외 정보를 감안한 요청 전체 상한
const MAX_REQUEST_BYTES = PDF_MAX_BYTES + 64 * 1024;

// 교사: PDF 학습자료로 AI 문제지 만들기(저장하지 않고 결과만 돌려줌)
export async function POST(request: Request) {
  const teacher = await requireTeacher(request);
  if (!teacher.ok) return teacher.response;
  const missing = missingCredentialsResponse();
  if (missing) return missing;

  const config = readAzureConfig();
  if (config === null) return errorResponse("AI 연결 설정이 아직 없습니다. 관리자가 서버 설정을 넣어야 합니다.", 503);
  if (config === "unsupported") return errorResponse("서버에 설정된 AI 연결 방식을 지원하지 않습니다.", 503);

  const length = Number(request.headers.get("content-length"));
  if (Number.isFinite(length) && length > MAX_REQUEST_BYTES) {
    return errorResponse("파일이 너무 큽니다. 512KB(524,288바이트) 이하만 올릴 수 있습니다.", 413);
  }

  let file: File | null = null;
  try {
    const form = await request.formData();
    const value = form.get("file");
    file = value instanceof File ? value : null;
  } catch {
    return errorResponse("보낸 파일을 읽을 수 없습니다. 다시 시도해 주세요.", 400);
  }
  if (!file) return errorResponse("PDF 파일을 골라 주세요.", 400);

  const fileCheck = checkPdfFile(file);
  if (!fileCheck.ok) return errorResponse(fileCheck.message, 400);

  const pdf = await readPdfText(new Uint8Array(await file.arrayBuffer()));
  if (!pdf.ok) return errorResponse(pdf.message, 422);

  let existingTitles: string[];
  try {
    existingTitles = (await listPapersForTeacher()).map((p) => p.title);
  } catch (error) {
    return storageErrorResponse(error);
  }

  const result = await generateQuizWithAzure(config, pdf.text, existingTitles);
  if (!result.ok) return errorResponse(result.message, result.status, { kind: result.kind });
  return json({ quiz: result.quiz });
}
