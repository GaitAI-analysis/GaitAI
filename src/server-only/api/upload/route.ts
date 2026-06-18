import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { isAuthed } from "@/lib/auth";
import { slugify } from "@/lib/posts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 25 * 1024 * 1024; // 25 MB

export async function POST(req: NextRequest) {
  if (!isAuthed()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: `File too large (max ${Math.round(MAX_BYTES / 1024 / 1024)}MB)` },
      { status: 413 }
    );
  }

  const originalName =
    (file as File).name || `upload-${Date.now()}`;
  const ext = path.extname(originalName);
  const base = slugify(originalName.replace(ext, "")) || "upload";
  const safeName = `${Date.now()}-${base}${ext.toLowerCase()}`;

  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(uploadDir, { recursive: true });

  const bytes = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join(uploadDir, safeName), bytes);

  return NextResponse.json({
    url: `/uploads/${safeName}`,
    name: originalName,
    size: file.size,
  });
}
