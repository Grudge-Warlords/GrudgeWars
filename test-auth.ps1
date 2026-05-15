# Test via api.grudge-studio.com (Railway game-api) and id.grudge-studio.com
foreach ($base in @('https://api.grudge-studio.com', 'https://id.grudge-studio.com')) {
Write-Host "`n===== Testing: $base ====="

Write-Host "`n--- /api/auth/verify ---"
$body = '{"sessionToken":"invalid-test-token"}'
$bytes = [System.Text.Encoding]::UTF8.GetBytes($body)
try {
    $r = Invoke-WebRequest -Uri "$base/auth/verify" -Method POST -UseBasicParsing -TimeoutSec 15 -ContentType 'application/json' -Body $bytes
    Write-Host "Status: $($r.StatusCode)"
    Write-Host "Body: $($r.Content)"
} catch {
    Write-Host "Status: $($_.Exception.Response.StatusCode.value__)"
    $stream = $_.Exception.Response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($stream)
    Write-Host "Body: $($reader.ReadToEnd())"
}

Write-Host "`n--- /api/auth/login ---"
$loginBody = '{"username":"testuser","password":"testpass123"}'
$loginBytes = [System.Text.Encoding]::UTF8.GetBytes($loginBody)
try {
    $r2 = Invoke-WebRequest -Uri "$base/auth/login" -Method POST -UseBasicParsing -TimeoutSec 15 -ContentType 'application/json' -Body $loginBytes
    Write-Host "Status: $($r2.StatusCode)"
    Write-Host "Body: $($r2.Content)"
} catch {
    Write-Host "Status: $($_.Exception.Response.StatusCode.value__)"
    $stream = $_.Exception.Response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($stream)
    Write-Host "Body: $($reader.ReadToEnd())"
}

Write-Host "`n--- /api/auth/puter ---"
$puterBody = '{"puterUsername":"testputer","puterUuid":"test-uuid-123"}'
$puterBytes = [System.Text.Encoding]::UTF8.GetBytes($puterBody)
try {
    $r3 = Invoke-WebRequest -Uri "$base/auth/puter" -Method POST -UseBasicParsing -TimeoutSec 15 -ContentType 'application/json' -Body $puterBytes
    Write-Host "Status: $($r3.StatusCode)"
    Write-Host "Body: $($r3.Content)"
} catch {
    Write-Host "Status: $($_.Exception.Response.StatusCode.value__)"
    $stream = $_.Exception.Response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($stream)
    Write-Host "Body: $($reader.ReadToEnd())"
}
} # end foreach
