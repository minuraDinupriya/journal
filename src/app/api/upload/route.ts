import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type. Only JPEG, PNG, and WebP are allowed." }, { status: 400 });
    }

    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "File size exceeds 10MB limit." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    
    const ext = path.extname(file.name) || (file.type === "image/jpeg" ? ".jpg" : file.type === "image/png" ? ".png" : ".webp");
    const uniqueName = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}${ext}`;
    
    const uploadDir = path.join(process.cwd(), "public", "uploads", "charts");
    
    try {
      await fs.access(uploadDir);
    } catch {
      await fs.mkdir(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, uniqueName);
    await fs.writeFile(filePath, buffer);

    return NextResponse.json({ path: `/uploads/charts/${uniqueName}` });
  } catch (error) {
    console.error("POST /api/upload error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
