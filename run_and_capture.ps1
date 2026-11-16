$dir = 'C:\Users\Devansh\Desktop\Student Market place\STUDENT_MARKETPLACE\server'
$proc = Start-Process -FilePath 'cmd.exe' -ArgumentList '/c','npm','run','dev' -WorkingDirectory $dir -RedirectStandardOutput 'stdout.txt' -RedirectStandardError 'stderr.txt' -PassThru
Start-Sleep -Seconds 12
$curl = curl http://localhost:5000 -i
if (-not $proc.HasExited) { Stop-Process -Id $proc.Id }
Write-Output '---STDOUT---'
Get-Content -Raw 'stdout.txt'
Write-Output '---STDERR---'
Get-Content -Raw 'stderr.txt'
Write-Output '---CURL---'
$curl
