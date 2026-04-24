@echo off
REM Arena Homes - Development Startup Script (Windows)
REM This script starts both backend and frontend servers

echo ========================================
echo Arena Homes - Starting Development Servers
echo ========================================
echo.

REM Check if .env files exist
if not exist "arena-server\.env" (
    echo [ERROR] Backend .env file not found!
    echo Please run: cd arena-server ^&^& cp .env.example .env
    echo Then configure your database connection.
    pause
    exit /b 1
)

if not exist "arena-web\.env.local" (
    echo [ERROR] Frontend .env.local file not found!
    echo Please run: cd arena-web ^&^& cp .env.example .env.local
    pause
    exit /b 1
)

echo [0/2] Setting up Database (Push + Seed)...
cd arena-server && call npm run db:setup
cd ..
echo.

echo [1/2] Starting Backend Server (Port 4000)...
echo.
start "Arena Backend" cmd /k "cd arena-server && npm run dev"

REM Wait a few seconds for backend to start
timeout /t 5 /nobreak > nul

echo [2/2] Starting Frontend Server (Port 3000)...
echo.
start "Arena Frontend" cmd /k "cd arena-web && npm run dev"

echo.
echo ========================================
echo Servers Starting!
echo ========================================
echo.
echo Backend:  http://localhost:4001/api
echo Frontend: http://localhost:3000
echo.
echo Login: admin@arenahomes.test / Admin#1234
echo.
echo Press any key to exit this window...
echo (Servers will continue running in separate windows)
pause > nul
