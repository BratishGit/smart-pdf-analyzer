# Backend Smoke Test Script
$baseUrl = "http://localhost:8080/api"
$testUser = "testuser_$(Get-Random)"
$testEmail = "$testUser@example.com"
$testPass = "Password123!"

function Invoke-ApiPost {
    param($path, $body)
    $json = $body | ConvertTo-Json
    return Invoke-RestMethod -Uri "$baseUrl/$path" -Method Post -Body $json -ContentType "application/json"
}

Write-Host "1. Registering user: $testUser" -ForegroundColor Cyan
$regBody = @{
    username = $testUser
    email = $testEmail
    password = $testPass
    fullName = "Test User"
}
$regResponse = Invoke-ApiPost "auth/register" $regBody
Write-Host "Registration successful." -ForegroundColor Green

Write-Host "2. Logging in..." -ForegroundColor Cyan
$loginBody = @{
    username = $testUser
    password = $testPass
}
$authResponse = Invoke-ApiPost "auth/login" $loginBody
$token = $authResponse.token
Write-Host "Login successful. Received token." -ForegroundColor Green

$headers = @{
    Authorization = "Bearer $token"
}

Write-Host "3. Uploading document..." -ForegroundColor Cyan
$filePath = "C:\Users\Bratish\.gemini\antigravity\scratch\mock-document.pdf"
if (!(Test-Path $filePath)) {
    Write-Host "Error: mock-document.pdf not found!" -ForegroundColor Red
    exit 1
}

$multipartBoundary = [System.Guid]::NewGuid().ToString()
$contentType = "multipart/form-data; boundary=$multipartBoundary"

$fileBytes = [System.IO.File]::ReadAllBytes($filePath)
$fileName = [System.IO.Path]::GetFileName($filePath)

$body = "--$multipartBoundary`r`n"
$body += "Content-Disposition: form-data; name=`"file`"; filename=`"$fileName`"`r`n"
$body += "Content-Type: application/pdf`r`n`r`n"
$encoding = [System.Text.Encoding]::GetEncoding("iso-8859-1")
$body = $encoding.GetBytes($body)

$footer = "`r`n--$multipartBoundary--`r`n"
$footer = $encoding.GetBytes($footer)

$fullBody = New-Object byte[] ($body.Length + $fileBytes.Length + $footer.Length)
[System.Buffer]::BlockCopy($body, 0, $fullBody, 0, $body.Length)
[System.Buffer]::BlockCopy($fileBytes, 0, $fullBody, $body.Length, $fileBytes.Length)
[System.Buffer]::BlockCopy($footer, 0, $fullBody, ($body.Length + $fileBytes.Length), $footer.Length)

$uploadResponse = Invoke-RestMethod -Uri "$baseUrl/documents/upload" -Method Post -Headers $headers -Body $fullBody -ContentType $contentType
Write-Host "Upload successful. Document ID: $($uploadResponse.id)" -ForegroundColor Green

Write-Host "4. Fetching documents..." -ForegroundColor Cyan
$docs = Invoke-RestMethod -Uri "$baseUrl/documents" -Method Get -Headers $headers
Write-Host "Found $($docs.Count) documents." -ForegroundColor Green
$docs | ForEach-Object { Write-Host "- $($_.originalFilename) (Status: $($_.status))" }

Write-Host "`nSmoke test COMPLETED SUCCESSFULLY!" -ForegroundColor Green
