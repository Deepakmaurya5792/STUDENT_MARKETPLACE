$dir = 'C:\Users\Devansh\Desktop\Student Market place\STUDENT_MARKETPLACE\server'
Set-Location $dir
# Start dev server, capture stdout and stderr
$proc = Start-Process -FilePath 'npm.cmd' -ArgumentList 'run','dev' -RedirectStandardOutput "$dir\stdout.txt" -RedirectStandardError "$dir\stderr.txt" -PassThru
# Wait for server to start (30 seconds)
Start-Sleep -Seconds 30
# Perform curl request
$curlOutput = curl http://localhost:5000 -i
# Stop server if still running
if (-not $proc.HasExited) { Stop-Process -Id $proc.Id -Force }
# Read captured output
$stdout = Get-Content -Raw "$dir\stdout.txt"
$stderr = Get-Content -Raw "$dir\stderr.txt"
Write-Output '---STDOUT---'
Write-Output $stdout
Write-Output '---STDERR---'
Write-Output $stderr
Write-Output '---CURL---'
Write-Output $curlOutput
