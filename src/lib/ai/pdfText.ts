import "server-only";
import { extractText, getDocumentProxy } from "unpdf";
import { checkExtractedText, normalizeExtractedText } from "./limits";

export type PdfTextResult = { ok: true; text: string } | { ok: false; message: string };

// PDF 본문을 읽습니다. 파일과 본문은 메모리에서만 쓰고 어디에도 저장하지 않습니다.
export async function readPdfText(bytes: Uint8Array): Promise<PdfTextResult> {
  let raw: string;
  try {
    const pdf = await getDocumentProxy(bytes);
    raw = (await extractText(pdf, { mergePages: true })).text;
  } catch (error) {
    const name = error instanceof Error ? error.name : "";
    if (name === "PasswordException") {
      return { ok: false, message: "암호가 걸린 PDF는 읽을 수 없습니다. 암호를 푼 PDF를 올려 주세요." };
    }
    if (name === "InvalidPDFException") {
      return { ok: false, message: "PDF 파일이 손상되었거나 올바른 PDF가 아닙니다. 다른 파일을 올려 주세요." };
    }
    console.error("[pdf]", error);
    return { ok: false, message: "PDF를 읽지 못했습니다. 다른 PDF로 다시 시도해 주세요." };
  }

  const text = normalizeExtractedText(raw);
  const check = checkExtractedText(text);
  return check.ok ? { ok: true, text } : check;
}
