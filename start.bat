@echo off
echo Starting Quizlet Vocabulary App...
echo.

echo Installing server dependencies...
if not exist node_modules (
    echo Copying server-package.json to package.json temporarily...
    copy server-package.json temp-package.json
    npm install express cors nodemon
    del temp-package.json
    echo Server dependencies installed.
) else (
    echo Dependencies already installed.
)

echo.
echo Starting server on port 3001...
start "Quizlet Server" cmd /k "node server.js"

echo.
echo Waiting for server to start...
timeout /t 3 /nobreak > nul

echo.
echo Starting React development server...
echo Server will be available at: http://localhost:3001
echo React app will be available at: http://localhost:5173
echo.
echo Press Ctrl+C in the server window to stop the server
echo.

npm run dev