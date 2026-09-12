# TradeJournal - Setup Script for Windows
# Run this script once to initialize the project

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  TradeJournal - Project Setup" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check Node.js
Write-Host "[1/7] Checking Node.js installation..." -ForegroundColor Yellow
$nodeVersion = node --version 2>$null
if (-not $nodeVersion) {
    Write-Host "ERROR: Node.js is not installed. Please install Node.js 18+ from https://nodejs.org" -ForegroundColor Red
    exit 1
}
Write-Host "  Node.js $nodeVersion found" -ForegroundColor Green

# Step 2: Install dependencies
Write-Host ""
Write-Host "[2/7] Installing npm dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: npm install failed" -ForegroundColor Red
    exit 1
}
Write-Host "  Dependencies installed successfully" -ForegroundColor Green

# Step 3: Copy .env.example to .env.local if not exists
Write-Host ""
Write-Host "[3/7] Setting up environment file..." -ForegroundColor Yellow
if (-not (Test-Path ".env.local")) {
    Copy-Item ".env.example" ".env.local"
    Write-Host "  Created .env.local from .env.example" -ForegroundColor Green
    Write-Host "  NOTE: Add your Gemini API key to .env.local for AI Coach features" -ForegroundColor Yellow
} else {
    Write-Host "  .env.local already exists, skipping" -ForegroundColor Green
}

# Step 4: Generate Prisma client
Write-Host ""
Write-Host "[4/7] Generating Prisma client..." -ForegroundColor Yellow
npx prisma generate
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Prisma generate failed" -ForegroundColor Red
    exit 1
}
Write-Host "  Prisma client generated successfully" -ForegroundColor Green

# Step 5: Push database schema
Write-Host ""
Write-Host "[5/7] Creating SQLite database..." -ForegroundColor Yellow
npx prisma db push
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Database creation failed" -ForegroundColor Red
    exit 1
}
Write-Host "  Database created successfully" -ForegroundColor Green

# Step 6: Seed database
Write-Host ""
Write-Host "[6/7] Seeding database with defaults..." -ForegroundColor Yellow
npx tsx prisma/seed.ts
if ($LASTEXITCODE -ne 0) {
    Write-Host "WARNING: Database seeding failed (non-critical)" -ForegroundColor Yellow
} else {
    Write-Host "  Database seeded successfully" -ForegroundColor Green
}

# Step 7: Create upload directory
Write-Host ""
Write-Host "[7/7] Creating upload directories..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path "public/uploads/charts" | Out-Null
Write-Host "  Upload directories created" -ForegroundColor Green

# Step 8: Initialize Git (optional)
Write-Host ""
Write-Host "Initializing Git repository..." -ForegroundColor Yellow
if (-not (Test-Path ".git")) {
    git init
    git add .
    git commit -m "feat: initial project setup with Next.js 14, Prisma, and shadcn/ui"
    Write-Host "  Git repository initialized with initial commit" -ForegroundColor Green
} else {
    Write-Host "  Git repository already exists, skipping" -ForegroundColor Green
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Setup Complete!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "To start the development server:" -ForegroundColor White
Write-Host "  npm run dev" -ForegroundColor Yellow
Write-Host ""
Write-Host "Then open http://localhost:3000 in your browser" -ForegroundColor White
Write-Host ""
Write-Host "Optional: Add your Gemini API key to .env.local" -ForegroundColor White
Write-Host "  Get a free key at: https://aistudio.google.com/app/apikey" -ForegroundColor Yellow
Write-Host ""
