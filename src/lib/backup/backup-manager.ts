import { promises as fs } from "fs";
import path from "path";
import JSZip from "jszip";
import { prisma } from "@/lib/db/prisma";
import { encryptBackup, decryptBackup, isEncryptedBackup } from "./crypto";
import { hasGoogleCredentials, uploadToGoogleDrive } from "./google-drive";

export interface BackupManifest {
  version: number;
  appName: string;
  createdAt: string;
  isEncrypted: boolean;
  counts: {
    trades: number;
    journalEntries: number;
    tags: number;
    charts: number;
  };
}

export function getDefaultCloudPath(): string {
  const userProfile = process.env.USERPROFILE || "C:\\Users\\minura";
  
  // Check typical Google Drive desktop drive
  const gDrive = "G:\\My Drive\\TradeJournalBackups";
  // Check user profile Google Drive
  const userGDrive = path.join(userProfile, "Google Drive", "TradeJournalBackups");
  // Check user profile OneDrive (already present on this machine)
  const oneDrive = path.join(userProfile, "OneDrive", "TradeJournalBackups");

  return oneDrive;
}

/**
 * Creates a complete backup package (.zip or encrypted .tjbackup).
 */
export async function createBackupBundle(options?: { password?: string }) {
  const zip = new JSZip();

  // 1. Fetch raw SQLite database file
  const dbPath = path.join(process.cwd(), "prisma", "dev.db");
  let dbBuffer: Buffer | null = null;
  try {
    dbBuffer = await fs.readFile(dbPath);
    zip.file("database.db", dbBuffer);
  } catch (err) {
    console.warn("Could not read prisma/dev.db directly:", err);
  }

  // 2. Fetch full structured data from Prisma (for human-readable / unscrambled JSON export)
  const [trades, journalEntries, tags, users] = await Promise.all([
    prisma.trade.findMany({
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
      orderBy: { entryDate: "desc" },
    }),
    prisma.journalEntry.findMany({
      orderBy: { date: "desc" },
    }),
    prisma.tag.findMany(),
    prisma.user.findMany(),
  ]);

  const unscrambledData = {
    exportedAt: new Date().toISOString(),
    version: 1,
    summary: {
      totalTrades: trades.length,
      totalJournalEntries: journalEntries.length,
      totalTags: tags.length,
    },
    users,
    tags,
    journalEntries,
    trades,
  };

  zip.file("trades_unscrambled.json", JSON.stringify(unscrambledData, null, 2));

  // 3. Collect all chart screenshot uploads
  const chartsDir = path.join(process.cwd(), "public", "uploads", "charts");
  let chartCount = 0;
  try {
    const files = await fs.readdir(chartsDir);
    const chartsFolder = zip.folder("charts");
    for (const file of files) {
      if (file === ".gitkeep") continue;
      const filePath = path.join(chartsDir, file);
      const stat = await fs.stat(filePath);
      if (stat.isFile()) {
        const fileData = await fs.readFile(filePath);
        chartsFolder?.file(file, fileData);
        chartCount++;
      }
    }
  } catch {
    // chartsDir might not exist yet if no charts uploaded
  }

  // 4. Create Manifest
  const manifest: BackupManifest = {
    version: 1,
    appName: "Trading Journal",
    createdAt: new Date().toISOString(),
    isEncrypted: Boolean(options?.password && options.password.trim().length > 0),
    counts: {
      trades: trades.length,
      journalEntries: journalEntries.length,
      tags: tags.length,
      charts: chartCount,
    },
  };

  zip.file("manifest.json", JSON.stringify(manifest, null, 2));

  // 5. Generate zip archive buffer
  const rawZipBuffer = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 9 },
  });

  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, "0");
  const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}`;

  if (manifest.isEncrypted && options?.password) {
    const encryptedBuffer = encryptBackup(rawZipBuffer, options.password);
    const filename = `trade-journal-backup-${dateStr}.tjbackup`;
    return {
      buffer: encryptedBuffer,
      filename,
      manifest,
      isEncrypted: true,
    };
  } else {
    const filename = `trade-journal-backup-${dateStr}.zip`;
    return {
      buffer: rawZipBuffer,
      filename,
      manifest,
      isEncrypted: false,
    };
  }
}

/**
 * Saves a generated backup buffer to the target cloud sync folder with retention management.
 */
export async function saveToCloudFolder(
  buffer: Buffer,
  filename: string,
  targetFolder?: string
): Promise<{ savedPath: string; folder: string; googleDrive?: { fileId: string; webViewLink?: string; name: string } }> {
  const folder = targetFolder && targetFolder.trim().length > 0 ? targetFolder.trim() : getDefaultCloudPath();

  await fs.mkdir(folder, { recursive: true });
  const fullPath = path.join(folder, filename);
  await fs.writeFile(fullPath, buffer);

  // Retention: keep only the last 3 backup files in this folder
  try {
    const MAX_RETENTION = 3;
    const files = await fs.readdir(folder);
    const backupFiles = files
      .filter((f) => f.startsWith("trade-journal-backup-") && (f.endsWith(".tjbackup") || f.endsWith(".zip")))
      .map((f) => path.join(folder, f));

    if (backupFiles.length > MAX_RETENTION) {
      const stats = await Promise.all(
        backupFiles.map(async (file) => ({
          file,
          mtime: (await fs.stat(file)).mtime.getTime(),
        }))
      );
      stats.sort((a, b) => b.mtime - a.mtime); // newest first
      const toDelete = stats.slice(MAX_RETENTION);
      for (const item of toDelete) {
        await fs.unlink(item.file).catch(() => {});
      }
    }
  } catch (err) {
    console.warn("Could not clean up old backups:", err);
  }

  // Also upload directly to Google Drive if credentials exist
  let googleDriveResult = undefined;
  if (await hasGoogleCredentials()) {
    try {
      googleDriveResult = await uploadToGoogleDrive(buffer, filename);
    } catch (gErr) {
      console.warn("Google Drive upload error:", gErr);
    }
  }

  return { savedPath: fullPath, folder, googleDrive: googleDriveResult };
}

/**
 * Restores the database and charts from an uploaded backup buffer.
 */
export async function restoreBackupBundle(
  fileBuffer: Buffer,
  password?: string
): Promise<{
  success: boolean;
  manifest: BackupManifest;
  restoredCounts: { trades: number; charts: number };
}> {
  let zipBuffer = fileBuffer;

  if (isEncryptedBackup(fileBuffer)) {
    if (!password || password.trim().length === 0) {
      throw new Error("This backup is locked with a password. Please enter the password to restore.");
    }
    zipBuffer = decryptBackup(fileBuffer, password);
  }

  const zip = await JSZip.loadAsync(zipBuffer);

  // Read manifest
  const manifestFile = zip.file("manifest.json");
  let manifest: BackupManifest;
  if (manifestFile) {
    const manifestStr = await manifestFile.async("string");
    manifest = JSON.parse(manifestStr);
  } else {
    manifest = {
      version: 1,
      appName: "Trading Journal",
      createdAt: new Date().toISOString(),
      isEncrypted: false,
      counts: { trades: 0, journalEntries: 0, tags: 0, charts: 0 },
    };
  }

  // Safety first: Create a backup of the current database before replacing it
  const dbPath = path.join(process.cwd(), "prisma", "dev.db");
  const backupCopyPath = path.join(process.cwd(), "prisma", `dev.db.bak-${Date.now()}`);
  try {
    await fs.copyFile(dbPath, backupCopyPath);
  } catch {
    // dev.db might not exist yet, which is fine
  }

  // 1. Restore SQLite database binary
  const dbFile = zip.file("database.db");
  if (dbFile) {
    const dbContent = await dbFile.async("nodebuffer");
    // Verify SQLite 3 header ("SQLite format 3\0")
    const header = dbContent.subarray(0, 16).toString();
    if (!header.startsWith("SQLite format 3")) {
      throw new Error("Corrupted backup: database file is not a valid SQLite database.");
    }
    await fs.writeFile(dbPath, dbContent);
  } else {
    throw new Error("Invalid backup bundle: missing database.db file.");
  }

  // 2. Restore chart images
  const chartsDir = path.join(process.cwd(), "public", "uploads", "charts");
  await fs.mkdir(chartsDir, { recursive: true });

  let restoredCharts = 0;
  const chartEntries = Object.keys(zip.files).filter(
    (name) => name.startsWith("charts/") && !zip.files[name].dir
  );

  for (const name of chartEntries) {
    const filename = path.basename(name);
    if (!filename || filename === ".gitkeep") continue;
    const fileData = await zip.files[name].async("nodebuffer");
    await fs.writeFile(path.join(chartsDir, filename), fileData);
    restoredCharts++;
  }

  // 3. Count restored trades from database to confirm
  const restoredTradeCount = await prisma.trade.count();

  return {
    success: true,
    manifest,
    restoredCounts: {
      trades: restoredTradeCount,
      charts: restoredCharts,
    },
  };
}
