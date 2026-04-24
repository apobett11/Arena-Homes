#!/bin/bash
# Arena Homes - Development Startup Script (Linux/Mac)
# This script starts both backend and frontend servers

echo "========================================"
echo "Arena Homes - Starting Development Servers"
echo "========================================"
echo ""

# Check if .env files exist
if [ ! -f "arena-server/.env" ]; then
    echo "[ERROR] Backend .env file not found!"
    echo "Please run: cd arena-server && cp .env.example .env"
    echo "Then configure your database connection."
    exit 1
fi

if [ ! -f "arena-web/.env.local" ]; then
    echo "[ERROR] Frontend .env.local file not found!"
    echo "Please run: cd arena-web && cp .env.example .env.local"
    exit 1
fi

echo "[0/2] Setting up Database (Push + Seed)..."
cd arena-server && npm run db:setup
cd ..
echo ""

echo "[1/2] Starting Backend Server (Port 4000)..."
echo ""

# Start backend in background
cd arena-server
npm run dev &
BACKEND_PID=$!
cd ..

# Wait a few seconds for backend to start
sleep 5

echo "[2/2] Starting Frontend Server (Port 3000)..."
echo ""

# Start frontend in background
cd arena-web
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "========================================"
echo "Servers Started!"
echo "========================================"
echo ""
echo "Backend:  http://localhost:4001/api"
echo "Frontend: http://localhost:3000"
echo ""
echo "Login: admin@arenahomes.test / Admin#1234"
echo ""
echo "Press Ctrl+C to stop all servers"
echo ""

# Wait for user interrupt
trap "echo ''; echo 'Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT

# Keep script running
wait
