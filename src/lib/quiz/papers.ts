import fs from "node:fs";
import path from "node:path";
import type { QuestionPaper } from "./types";
import { parseQuizFile } from "./validate";

// question-papers 폴더의 .json 문제지를 파일 이름 순서로 읽습니다.
// 화면 제작 때 읽으므로, 배포한 앱에 문제지를 추가하려면 다시 제작(배포)해야 합니다.
// 경로는 배포 도구가 이 폴더만 포함하도록 path.join(process.cwd(), "question-papers", ...) 형태로 고정해 둡니다.
export function loadQuestionPapers(): QuestionPaper[] {
  if (!fs.existsSync(path.join(process.cwd(), "question-papers"))) return [];

  return fs
    .readdirSync(path.join(process.cwd(), "question-papers"))
    .filter((name) => name.toLowerCase().endsWith(".json"))
    .sort((a, b) => a.localeCompare(b))
    .map((fileName): QuestionPaper => {
      const text = fs.readFileSync(path.join(process.cwd(), "question-papers", fileName), "utf8");
      const result = parseQuizFile(text);
      return result.ok
        ? { fileName, ok: true, quiz: result.quiz }
        : { fileName, ok: false, errors: result.errors };
    });
}
