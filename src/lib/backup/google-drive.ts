import { google } from "googleapis";
import { Readable } from "stream";
import path from "path";
import { promises as fs } from "fs";

export const DEFAULT_GDRIVE_FOLDER_ID = "1rGX5wUhQyCKUX8KuAituN9uoXMp56BL4";

function getCredentialsPath(): string {
  return path.join(process.cwd(), "google-credentials.json");
}

export async function hasGoogleCredentials(): Promise<boolean> {
  try {
    const credPath = getCredentialsPath();
    await fs.access(credPath);
    return true;
  } catch {
    return false;
  }
}

export async function getGoogleDriveClient() {
  const credPath = getCredentialsPath();
  const auth = new google.auth.GoogleAuth({
    keyFile: credPath,
    scopes: ["https://www.googleapis.com/auth/drive.file", "https://www.googleapis.com/auth/drive"],
  });

  const drive = google.drive({ version: "v3", auth });
  return drive;
}

export async function uploadToGoogleDrive(
  buffer: Buffer,
  filename: string,
  folderId: string = DEFAULT_GDRIVE_FOLDER_ID
): Promise<{ fileId: string; webViewLink?: string; name: string }> {
  const drive = await getGoogleDriveClient();

  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);

  const response = await drive.files.create({
    requestBody: {
      name: filename,
      parents: [folderId],
    },
    media: {
      mimeType: filename.endsWith(".zip") ? "application/zip" : "application/octet-stream",
      body: stream,
    },
    fields: "id, name, webViewLink",
  });

  const fileId = response.data.id!;
  const webViewLink = response.data.webViewLink || undefined;

  // Retention: clean up older backups in this Google Drive folder (keep last 15)
  try {
    const listRes = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false and name contains 'trade-journal-backup-'`,
      orderBy: "createdTime desc",
      fields: "files(id, name, createdTime)",
    });

    const files = listRes.data.files || [];
    if (files.length > 3) {
      const toDelete = files.slice(3);
      for (const file of toDelete) {
        if (file.id) {
          await drive.files.delete({ fileId: file.id }).catch(() => {});
        }
      }
    }
  } catch (err) {
    console.warn("Could not clean up older Google Drive backups:", err);
  }

  return { fileId, webViewLink, name: filename };
}

export async function checkGoogleDriveStatus(folderId: string = DEFAULT_GDRIVE_FOLDER_ID) {
  const exists = await hasGoogleCredentials();
  if (!exists) {
    return {
      connected: false,
      folderId,
      message: "Missing google-credentials.json key file in project root.",
    };
  }

  try {
    const drive = await getGoogleDriveClient();
    const folderRes = await drive.files.get({
      fileId: folderId,
      fields: "id, name",
    });

    const filesRes = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      orderBy: "createdTime desc",
      pageSize: 5,
      fields: "files(id, name, size, createdTime)",
    });

    return {
      connected: true,
      folderId,
      folderName: folderRes.data.name,
      totalBackups: filesRes.data.files?.length || 0,
      recentBackups: filesRes.data.files || [],
    };
  } catch (error: any) {
    return {
      connected: false,
      folderId,
      error: error?.message || "Failed to connect to Google Drive API with credentials.",
    };
  }
}
