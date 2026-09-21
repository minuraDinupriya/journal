import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { getDefaultCloudPath } from "@/lib/backup/backup-manager";
import { checkGoogleDriveStatus } from "@/lib/backup/google-drive";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const customPath = searchParams.get("cloudPath");
    const targetFolder = customPath && customPath.trim().length > 0 ? customPath.trim() : getDefaultCloudPath();

    let exists = false;
    let backups: Array<{ name: string; size: number; mtime: string }> = [];

    try {
      await fs.access(targetFolder);
      exists = true;

      const files = await fs.readdir(targetFolder);
      for (const file of files) {
        if (file.startsWith("trade-journal-backup-") && (file.endsWith(".tjbackup") || file.endsWith(".zip"))) {
          const filePath = path.join(targetFolder, file);
          const stat = await fs.stat(filePath);
          backups.push({
            name: file,
            size: stat.size,
            mtime: stat.mtime.toISOString(),
          });
        }
      }

      backups.sort((a, b) => new Date(b.mtime).getTime() - new Date(a.mtime).getTime());
    } catch {
      exists = false;
    }

    const googleDriveStatus = await checkGoogleDriveStatus();

    return NextResponse.json({
      folder: targetFolder,
      defaultPath: getDefaultCloudPath(),
      exists,
      latestBackup: backups.length > 0 ? backups[0] : null,
      totalBackups: backups.length,
      backups: backups.slice(0, 5), // return top 5
      googleDrive: googleDriveStatus,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to get backup status" }, { status: 500 });
  }
}
