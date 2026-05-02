@echo off
echo ===================================================
echo      GazeTalk - Core ML Test Suite
echo ===================================================
echo.
echo [1] Eye Tracking + Blink Detection Test
echo [2] Hand Sign Recognition Test
echo [3] Run Both Tests
echo.
set /p choice="Select test to run (1/2/3): "

if "%choice%"=="1" (
    start "" "%~dp0eye_tracking.html"
) else if "%choice%"=="2" (
    start "" "%~dp0hand_signs.html"
) else if "%choice%"=="3" (
    start "" "%~dp0eye_tracking.html"
    start "" "%~dp0hand_signs.html"
) else (
    echo Invalid choice.
)
pause
