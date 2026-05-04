@echo off
echo ============================================
echo EarlyFlag Dashboard Setup Script
echo ============================================
echo.

echo Step 1: Creating directory structure...
mkdir app 2>nul
mkdir components 2>nul
mkdir lib 2>nul
mkdir types 2>nul
echo ✓ Directories created!
echo.

echo Step 2: Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ✗ Node.js is not installed!
    echo Please install Node.js from: https://nodejs.org/
    echo After installing, run this script again.
    pause
    exit /b 1
)

echo ✓ Node.js is installed!
node --version
npm --version
echo.

echo Step 3: Installing dependencies...
echo This may take a few minutes...
call npm install
if %errorlevel% neq 0 (
    echo ✗ Installation failed!
    echo Please check the error messages above.
    pause
    exit /b 1
)
echo ✓ Dependencies installed successfully!
echo.

echo ============================================
echo Setup Complete!
echo ============================================
echo.
echo IMPORTANT: You still need to:
echo 1. Copy the code from CODE_FILES_PART1.md, PART2.md, and PART3.md
echo 2. Create the files in their respective directories
echo.
echo After copying all files, run:
echo     npm run dev
echo.
echo Then open http://localhost:3000 in your browser
echo.
pause
