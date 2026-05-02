@echo off
REM GazeTalk start script - launches Python backend and React Native (Expo) app

REM Start backend in new cmd window
start "GazeTalk Backend" cmd /k "cd /d %~dp0backend && venv\Scripts\python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload"

REM Start Expo / React Native app in new cmd window
start "GazeTalk Mobile (Expo)" cmd /k "cd /d %~dp0 && npx expo start --clear"

echo.
echo [GazeTalk] Backend started on http://0.0.0.0:8000
echo [GazeTalk] Expo dev server starting - scan the QR code with Expo Go or press 'a' for Android / 'i' for iOS
echo.
