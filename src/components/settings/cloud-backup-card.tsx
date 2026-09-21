"use client";

import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useBackupStore } from "@/stores/backup-store";
import { toast } from "sonner";
import {
  Cloud,
  Download,
  Upload,
  Lock,
  Unlock,
  RefreshCw,
  FolderCheck,
  ShieldCheck,
  AlertTriangle,
  FolderOpen,
  Eye,
  EyeOff,
  CheckCircle2,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function CloudBackupCard() {
  const {
    cloudFolder,
    backupPassword,
    autoSyncEnabled,
    lastSyncTime,
    setCloudFolder,
    setBackupPassword,
    setAutoSyncEnabled,
    setLastSyncTime,
  } = useBackupStore();

  const [defaultCloudPath, setDefaultCloudPath] = useState<string>("");
  const [folderExists, setFolderExists] = useState<boolean>(false);
  const [totalBackups, setTotalBackups] = useState<number>(0);
  const [latestBackup, setLatestBackup] = useState<any>(null);

  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isRestoring, setIsRestoring] = useState<boolean>(false);

  // Restore state
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [restorePassword, setRestorePassword] = useState<string>("");
  const [showRestoreDialog, setShowRestoreDialog] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch status of the cloud folder
  const checkCloudStatus = async () => {
    try {
      const query = cloudFolder ? `?cloudPath=${encodeURIComponent(cloudFolder)}` : "";
      const res = await fetch(`/api/backup/status${query}`);
      if (res.ok) {
        const data = await res.json();
        setDefaultCloudPath(data.defaultPath);
        setFolderExists(data.exists);
        setTotalBackups(data.totalBackups || 0);
        setLatestBackup(data.latestBackup || null);
        if (!cloudFolder && data.defaultPath) {
          setCloudFolder(data.defaultPath);
        }
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    checkCloudStatus();
  }, [cloudFolder]);

  // Handle Download Full Backup
  const handleDownloadBackup = async () => {
    setIsExporting(true);
    try {
      const res = await fetch("/api/backup/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password: backupPassword || undefined,
          download: true,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to generate backup");
      }

      const filename =
        res.headers.get("X-Backup-Filename") ||
        (backupPassword ? "trade-journal-backup.tjbackup" : "trade-journal-backup.zip");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Backup downloaded successfully!", {
        description: backupPassword
          ? "Encrypted with AES-256 password lock."
          : "Full database, trades JSON & charts bundled.",
      });
    } catch (err: any) {
      toast.error("Export failed", { description: err.message });
    } finally {
      setIsExporting(false);
    }
  };

  // Handle Cloud Sync
  const handleSyncToCloud = async () => {
    setIsSyncing(true);
    try {
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

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to sync backup to cloud folder");
      }

      const nowStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      setLastSyncTime(nowStr);
      await checkCloudStatus();

      toast.success("Backup synced to Cloud Drive!", {
        description: `Saved to: ${data.cloudResult?.savedPath || "Cloud folder"}`,
      });
    } catch (err: any) {
      toast.error("Cloud sync failed", { description: err.message });
    } finally {
      setIsSyncing(false);
    }
  };

  // Trigger file selection for restore
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setRestoreFile(file);
      setRestorePassword(backupPassword || ""); // Pre-fill with current password if available
      setShowRestoreDialog(true);
    }
    // reset input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Execute restore
  const handleConfirmRestore = async () => {
    if (!restoreFile) return;

    setIsRestoring(true);
    const formData = new FormData();
    formData.append("file", restoreFile);
    if (restorePassword) {
      formData.append("password", restorePassword);
    }

    try {
      const res = await fetch("/api/backup/restore", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to restore backup archive");
      }

      toast.success("Journal restored successfully!", {
        description: `Restored ${data.restoredCounts?.trades ?? 0} trades and ${data.restoredCounts?.charts ?? 0} charts. Reloading...`,
      });

      setShowRestoreDialog(false);
      setTimeout(() => {
        window.location.reload();
      }, 1200);
    } catch (err: any) {
      toast.error("Restore failed", { description: err.message });
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <>
      <Card className="border-indigo-500/30 shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500">
                <Cloud className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-lg">Cloud Backup & Password Lock</CardTitle>
                <CardDescription>
                  Keep your trades, journal notes, dates, and chart images safe in Google Drive or OneDrive.
                </CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="gap-1.5 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10">
              <ShieldCheck className="w-3.5 h-3.5" />
              {backupPassword ? "AES-256 Encrypted" : "Zero-Scramble ISO"}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 pt-2">
          {/* Action Row: Export & Cloud Sync */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button
              onClick={handleSyncToCloud}
              disabled={isSyncing}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium flex items-center gap-2 h-11"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} />
              {isSyncing ? "Syncing to Cloud..." : "Sync to Cloud Drive Now"}
            </Button>

            <Button
              onClick={handleDownloadBackup}
              disabled={isExporting}
              variant="outline"
              className="border-indigo-500/30 hover:bg-indigo-500/10 flex items-center gap-2 h-11"
            >
              <Download className="w-4 h-4 text-indigo-500" />
              {isExporting ? "Packaging Backup..." : "Download Backup Archive"}
            </Button>
          </div>

          {/* Sync Status Banner */}
          <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <FolderCheck className="w-4 h-4 text-indigo-500 shrink-0" />
              <div>
                <span className="text-muted-foreground">Target Cloud Folder: </span>
                <span className="font-mono font-medium text-foreground">{cloudFolder || defaultCloudPath || "Auto-detect"}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              {lastSyncTime ? (
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Synced at {lastSyncTime}
                </span>
              ) : totalBackups > 0 ? (
                <span>{totalBackups} backups in cloud folder</span>
              ) : (
                <span>Not synced yet</span>
              )}
            </div>
          </div>

          {/* Password Protection ("Locking the folder / backup") */}
          <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <Label className="font-semibold text-sm flex items-center gap-2">
                {backupPassword ? <Lock className="w-4 h-4 text-amber-500" /> : <Unlock className="w-4 h-4 text-slate-400" />}
                Password Lock (AES-256 Military Grade)
              </Label>
              <span className="text-xs text-muted-foreground">
                {backupPassword ? "Encrypted before leaving your PC" : "Optional password protection"}
              </span>
            </div>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Enter password to lock your backup (or leave empty)"
                value={backupPassword}
                onChange={(e) => setBackupPassword(e.target.value)}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              When a password is set, your backup is saved as an encrypted <code className="font-mono text-indigo-500">.tjbackup</code> file.
              Even if someone accesses your Google Drive or OneDrive, they cannot view your trades, profits, or chart images without this password.
            </p>
          </div>

          {/* Cloud Folder Path Setting */}
          <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <Label className="font-semibold text-sm flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-indigo-500" />
              Cloud Sync Folder Path
            </Label>
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="e.g. G:\My Drive\TradeJournalBackups or C:\Users\minura\OneDrive\TradeJournalBackups"
                value={cloudFolder}
                onChange={(e) => setCloudFolder(e.target.value)}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCloudFolder(defaultCloudPath)}
                className="shrink-0 text-xs"
              >
                Reset Default
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Point this to your Google Drive Desktop folder (e.g. <code className="font-mono">G:\My Drive\TradingBackups</code>) or your OneDrive folder.
              The journal keeps your last 3 backups automatically, saving cloud storage.
            </p>
          </div>

          {/* Auto-Sync Checkbox */}
          <div className="flex items-center space-x-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <Checkbox
              id="autoSync"
              checked={autoSyncEnabled}
              onCheckedChange={(checked) => setAutoSyncEnabled(Boolean(checked))}
            />
            <Label htmlFor="autoSync" className="text-sm font-medium cursor-pointer">
              Auto-sync fresh backup to cloud folder whenever a trade is logged or edited
            </Label>
          </div>

          {/* Restore Section */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 bg-amber-500/5 -mx-6 -mb-6 p-6 rounded-b-xl border-t">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <Upload className="w-4 h-4 text-amber-500" />
                  Restore Journal on a New Computer
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Drop your <code className="font-mono text-foreground">.tjbackup</code> or <code className="font-mono text-foreground">.zip</code> file here to reload all your trades and chart images.
                </p>
              </div>

              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".tjbackup,.zip"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 flex items-center gap-2 h-10 w-full sm:w-auto"
                >
                  <Upload className="w-4 h-4" />
                  Select Backup to Restore
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Restore Confirmation Dialog */}
      <AlertDialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-foreground">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Restore Trading Journal?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3 pt-2">
              <p>
                You are about to restore data from:{" "}
                <span className="font-semibold text-foreground">{restoreFile?.name}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                This will safely restore your complete database, trading notes, and chart screenshots.
                A backup snapshot of your current database will be saved before restoring.
              </p>

              {/* Password prompt if file ends with .tjbackup or user set a password */}
              <div className="space-y-1.5 pt-2">
                <Label className="text-xs font-semibold">
                  Backup Password (leave empty if unencrypted):
                </Label>
                <Input
                  type="password"
                  placeholder="Enter backup password"
                  value={restorePassword}
                  onChange={(e) => setRestorePassword(e.target.value)}
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRestoring}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmRestore}
              disabled={isRestoring}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {isRestoring ? "Restoring Data..." : "Confirm & Restore"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
