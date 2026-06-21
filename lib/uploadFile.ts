import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const UPLOAD_BASE =
  process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");

const ALLOWED_MIME = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

export async function uploadFile(
  file: File,
  subDir: "assignments" | "solutions",
): Promise<{
  filePath: string;
  originalFileName: string;
  fileSize: number;
  mimeType: string;
}> {
  if (!ALLOWED_MIME.includes(file.type)) {
    throw new Error("نوع الملف غير مدعوم. يسمح فقط بـ PDF و Word.");
  }
  if (file.size > MAX_SIZE) {
    throw new Error("حجم الملف يجب أن لا يتجاوز 5 ميجابايت.");
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const ext =
    path.extname(file.name) ||
    (file.type === "application/pdf" ? ".pdf" : ".docx");
  const uniqueName = `${uuidv4()}${ext}`;
  const dir = path.join(UPLOAD_BASE, subDir);
  const fullPath = path.join(dir, uniqueName);

  // Ensure directory exists
  await mkdir(dir, { recursive: true });

  await writeFile(fullPath, buffer);

  return {
    filePath: fullPath,
    originalFileName: file.name,
    fileSize: file.size,
    mimeType: file.type,
  };
}
