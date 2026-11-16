@echo off
cd /d "C:\Users\Devansh\Desktop\Student Market place\STUDENT_MARKETPLACE\server"
rem Start the dev server in background, capture output
start "devserver" /b npm run dev > stdout.txt 2> stderr.txt

rem Wait for 30 seconds to let server run
timeout /t 30 >nul

rem Perform curl request
curl http://localhost:5000 -i > curl.txt

rem Kill the node process (dev server)
taskkill /F /IM node.exe >nul 2>&1

echo ---STDOUT---
type stdout.txt
echo ---STDERR---
type stderr.txt
echo ---CURL---
type curl.txt
