import { create } from "zustand";
import { persist } from "zustand/middleware";

interface BackupState {
  cloudFolder: string;
  backupPassword: string;
  autoSyncEnabled: boolean;
  syncOnTradeChange: boolean;
  lastSyncTime: string | null;
  setCloudFolder: (path: string) => void;
  setBackupPassword: (password: string) => void;
  setAutoSyncEnabled: (enabled: boolean) => void;
  setSyncOnTradeChange: (enabled: boolean) => void;
  setLastSyncTime: (time: string) => void;
}

export const useBackupStore = create<BackupState>()(
  persist(
    (set) => ({
      cloudFolder: "",
      backupPassword: "",
      autoSyncEnabled: true,
      syncOnTradeChange: true,
      lastSyncTime: null,
      setCloudFolder: (cloudFolder) => set({ cloudFolder }),
      setBackupPassword: (backupPassword) => set({ backupPassword }),
      setAutoSyncEnabled: (autoSyncEnabled) => set({ autoSyncEnabled }),
      setSyncOnTradeChange: (syncOnTradeChange) => set({ syncOnTradeChange }),
      setLastSyncTime: (lastSyncTime) => set({ lastSyncTime }),
    }),
    {
      name: "trade-backup-settings",
    }
  )
);
