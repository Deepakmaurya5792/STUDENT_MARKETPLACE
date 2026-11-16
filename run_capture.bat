@echo off
cd /d "C:\Users\Devansh\Desktop\Student Market place\STUDENT_MARKETPLACE\server"
start "" cmd /c "npm run dev ^> stdout.txt 2^> stderr.txt"
timeout /t 30 >nul
curl http://localhost:5000 -i > curl.txt
taskkill /F /IM node.exe
echo ---STDOUT---
type stdout.txt
echo ---STDERR---
type stderr.txt
echo ---CURL---
type curl.txt
