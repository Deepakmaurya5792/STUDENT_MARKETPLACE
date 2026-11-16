$path = 'C:\Users\Devansh\Desktop\Student Market place\STUDENT_MARKETPLACE\server\dev.log'
$max = 5
$deleted = $false
for ($i = 1; $i -le $max; $i++) {
    if (Test-Path $path) {
        try {
            Remove-Item $path -ErrorAction Stop
            $deleted = $true
            break
        } catch {
            Start-Sleep -Seconds 2
        }
    } else {
        $deleted = $true
        break
    }
}
Start-Sleep -Seconds 5
if (Test-Path $path) {
    $content = Get-Content $path -TotalCount 100
    if ($content) {
        $status = $content -join "`n"
    } else {
        $status = 'Empty'
    }
} else {
    $status = 'NotExists'
}
$prefix = if ($deleted) { 'Deleted' } else { 'Failed' }
Write-Output "${prefix}; $status"