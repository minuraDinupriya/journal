@echo off
title Trading Journal
echo ========================================================
echo   Starting Trading Journal with Cloud Auto-Sync
echo ========================================================
echo.
call npm run dev
echo.
echo ========================================================
echo   Shutting down: Syncing latest backup to Cloud...
echo ========================================================
call npm run backup
echo.
echo   [OK] Cloud Backup synced! You can safely close this window.
timeout /t 5
