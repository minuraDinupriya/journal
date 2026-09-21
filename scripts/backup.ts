import { createBackupBundle, saveToCloudFolder } from "../src/lib/backup/backup-manager";

async function main() {
  console.log("Creating Trade Journal backup...");
  try {
    const bundle = await createBackupBundle();
    const result = await saveToCloudFolder(bundle.buffer, bundle.filename);
    console.log(`Successfully created backup: ${bundle.filename}`);
    console.log(`Saved to cloud folder: ${result.savedPath}`);
    if (result.googleDrive) {
      console.log(`[Google Drive Cloud] Uploaded successfully to Google Drive! File ID: ${result.googleDrive.fileId}`);
    }
    console.log(`Trades included: ${bundle.manifest.counts.trades}`);
    console.log(`Charts included: ${bundle.manifest.counts.charts}`);
  } catch (error) {
    console.error("Backup failed:", error);
    process.exit(1);
  }
}

main();
