import { useBackupStore } from "@/stores/backup-store";

let isSyncing = false;

/**
 * Triggers background auto-sync to the configured cloud drive if enabled.
 */
export async function triggerAutoSyncIfEnabled() {
  if (typeof window === "undefined") return;
  if (isSyncing) return;

  const { autoSyncEnabled, cloudFolder, backupPassword, setLastSyncTime } = useBackupStore.getState();
  if (!autoSyncEnabled) return;

  try {
    isSyncing = true;
    const res = await fetch("/api/backup/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        password: backupPassword || undefined,
        saveToCloud: true,
        cloudPath: cloudFolder || undefined,
        download: false,
      }),
    });

    if (res.ok) {
      const nowStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      setLastSyncTime(nowStr);
    }
  } catch (err) {
    console.warn("Background auto-sync error:", err);
  } finally {
    isSyncing = false;
  }
}
