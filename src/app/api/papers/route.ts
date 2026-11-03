import { connection } from "next/server";
import { json, missingCredentialsResponse, storageErrorResponse } from "@/lib/api/respond";
import { listPublishedPapers } from "@/lib/quiz/store";

// 학생: 공개된 문제지 목록(제목과 문항 수만)
export async function GET() {
  await connection();
  const missing = missingCredentialsResponse();
  if (missing) return missing;

  try {
    return json({ papers: await listPublishedPapers() });
  } catch (error) {
    return storageErrorResponse(error);
  }
}
