import { NextResponse } from "next/server";
import { createBackupBundle, saveToCloudFolder } from "@/lib/backup/backup-manager";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { password, saveToCloud, cloudPath, download = true } = body;

    const bundle = await createBackupBundle({ password });

    let cloudResult = null;
    if (saveToCloud) {
      cloudResult = await saveToCloudFolder(bundle.buffer, bundle.filename, cloudPath);
    }

    if (download) {
      return new NextResponse(new Uint8Array(bundle.buffer), {
        status: 200,
        headers: {
          "Content-Type": bundle.isEncrypted ? "application/octet-stream" : "application/zip",
          "Content-Disposition": `attachment; filename="${bundle.filename}"`,
          "X-Backup-Filename": bundle.filename,
          "X-Backup-Encrypted": String(bundle.isEncrypted),
          "X-Cloud-Saved": String(Boolean(cloudResult)),
          "X-Cloud-Path": cloudResult ? encodeURIComponent(cloudResult.savedPath) : "",
        },
      });
    }

    return NextResponse.json({
      success: true,
      filename: bundle.filename,
      isEncrypted: bundle.isEncrypted,
      manifest: bundle.manifest,
      cloudResult,
    });
  } catch (error: any) {
    console.error("POST /api/backup/export error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create backup bundle" },
      { status: 500 }
    );
  }
}
