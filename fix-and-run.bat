@echo off
cd arena-web
rd /s /q .next 2>nul
set TURBOPACK=false
npm run dev
