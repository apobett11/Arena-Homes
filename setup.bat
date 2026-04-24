@echo off
REM Arena Homes - First-Time Setup Script (Windows)

echo ========================================
echo Arena Homes - First-Time Setup
echo ========================================
echo.
echo This script will:
echo 1. Install all dependencies
echo 2. Set up environment files
echo 3. Initialize database
echo 4. Seed test data
echo.
pause

REM Step 1: Install backend dependencies
echo.
echo [1/6] Installing backend dependencies...
cd arena-server
if not exist "node_modules" (
    call npm install
    if errorlevel 1 (
        echo [ERROR] Failed to install backend dependencies
        pause
        exit /b 1
    )
) else (
    echo Backend dependencies already installed
)
cd ..

REM Step 2: Install frontend dependencies
echo.
echo [2/6] Installing frontend dependencies...
cd arena-web
if not exist "node_modules" (
    call npm install
    if errorlevel 1 (
        echo [ERROR] Failed to install frontend dependencies
        pause
        exit /b 1
    )
) else (
    echo Frontend dependencies already installed
)
cd ..

REM Step 3: Set up backend .env
echo.
echo [3/6] Setting up backend environment...
if not exist "arena-server\.env" (
    copy "arena-server\.env.example" "arena-server\.env"
    echo [IMPORTANT] Please edit arena-server\.env and configure:
    echo   - DATABASE_URL
    echo   - JWT_SECRET
    echo   - REFRESH_TOKEN_SECRET
    echo.
    echo Opening .env file...
    start notepad "arena-server\.env"
    echo.
    echo Press any key after you've configured the .env file...
    pause > nul
) else (
    echo Backend .env already exists
)

REM Step 4: Set up frontend .env.local
echo.
echo [4/6] Setting up frontend environment...
if not exist "arena-web\.env.local" (
    copy "arena-web\.env.example" "arena-web\.env.local"
    echo Frontend .env.local created
) else (
    echo Frontend .env.local already exists
)

REM Step 5: Initialize database
echo.
echo [5/6] Initializing database schema...
cd arena-server
call npm run db:push
if errorlevel 1 (
    echo [ERROR] Failed to initialize database
    echo Please check your DATABASE_URL in .env
    cd ..
    pause
    exit /b 1
)
cd ..

REM Step 6: Seed test data
echo.
echo [6/6] Seeding test data...
cd arena-server
call npm run seed:minimal
if errorlevel 1 (
    echo [ERROR] Failed to seed database
    cd ..
    pause
    exit /b 1
)
cd ..

echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo You can now start the development servers:
echo   Option 1: Double-click start-dev.bat
echo   Option 2: Run manually:
echo     Terminal 1: cd arena-server ^&^& npm run dev
echo     Terminal 2: cd arena-web ^&^& npm run dev
echo.
echo Access the application:
echo   Frontend: http://localhost:3000
echo   Backend:  http://localhost:4000/api
echo.
echo Test Login:
echo   Email:    admin@arenahomes.test
echo   Password: Admin#1234
echo.
pause
