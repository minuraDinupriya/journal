import { NextResponse } from "next/server";
import { restoreBackupBundle } from "@/lib/backup/backup-manager";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const password = (formData.get("password") as string) || "";

    if (!file) {
      return NextResponse.json({ error: "No backup file uploaded" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await restoreBackupBundle(buffer, password);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("POST /api/backup/restore error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to restore backup" },
      { status: 400 }
    );
  }
}
