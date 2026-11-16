$path = 'C:\Users\Devansh\Desktop\Student Market place\STUDENT_MARKETPLACE\server\dev.log'
$maxAttempts = 5
$deleted = $false
for ($i = 1; $i -le $maxAttempts; $i++) {
    if (-not (Test-Path $path)) { $deleted = $true; break }
    try {
        Remove-Item $path -ErrorAction Stop
        $deleted = $true
        break
    } catch {
        Start-Sleep -Seconds 2
    }
}
Start-Sleep -Seconds 5
if (Test-Path $path) {
    $content = Get-Content $path -TotalCount 100
    if ($content) {
        $out = "Exists;" + ($content -join "`n")
    } else {
        $out = "Exists;Empty"
    }
} else {
    $out = "NotExists"
}
if ($deleted) { $prefix = 'Deleted' } else { $prefix = 'Failed' }
Write-Output "$prefix;$out"