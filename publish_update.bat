@echo off
echo ==========================================
echo   Solari Updater - Send to GitHub
echo ==========================================
echo.

set /p commit_msg="Type a description of your changes (e.g. 'Fix login bug'): "

if "%commit_msg%"=="" (
    echo Error: You must provide a description.
    pause
    exit /b
)

echo.
echo 1. Adding files...
git add .

echo 2. Committing changes...
git commit -m "%commit_msg%"

echo 3. Sending to GitHub...
git push

echo.
echo ==========================================
echo   DONE! Check the 'Actions' tab on GitHub.
echo ==========================================
pause
