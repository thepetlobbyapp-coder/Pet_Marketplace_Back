<#
.SYNOPSIS
  Smoke test do endpoint /me/avatar: login + upload + GET + rejeicoes + delete.

.DESCRIPTION
  Le credenciais Supabase do .env do mobile e roda os 6 smokes em sequencia.

.EXAMPLE
  .\scripts\smoke-avatar.ps1 -Email "israel@pet.com" -Password "12345678"
#>

[CmdletBinding()]
param(
  [Parameter(Mandatory=$true)] [string] $Email,
  [Parameter(Mandatory=$true)] [string] $Password,
  [string] $ImagePath,
  [string] $ApiBaseUrl = "http://localhost:3000"
)

$ErrorActionPreference = "Stop"

function Write-Step([string]$label, [string]$message) {
  Write-Host ""
  Write-Host "==[ $label ]==" -ForegroundColor Cyan
  if ($message) { Write-Host $message }
}
function Write-OK([string]$msg)   { Write-Host "  OK  $msg" -ForegroundColor Green }
function Write-Warn([string]$msg) { Write-Host "  !!  $msg" -ForegroundColor Yellow }
function Write-Fail([string]$msg) { Write-Host "  XX  $msg" -ForegroundColor Red }

# Helper: roda curl separando body (arquivo temp) e status code (stdout).
# Retorna hashtable @{ Code = "200"; Body = "..." }.
function Invoke-CurlCapture {
  param(
    [string]   $Method,
    [string]   $Url,
    [string]   $Token,
    [string]   $FilePath   # opcional: caminho de arquivo para -F image=@...
  )
  $bodyTmp = [IO.Path]::GetTempFileName()
  try {
    if ($FilePath) {
      $rawCode = curl.exe -s -o $bodyTmp -w "%{http_code}" `
        -X $Method $Url `
        -H "Authorization: Bearer $Token" `
        -F "image=@$FilePath"
    } else {
      $rawCode = curl.exe -s -o $bodyTmp -w "%{http_code}" `
        -X $Method $Url `
        -H "Authorization: Bearer $Token"
    }
    # PowerShell pode devolver $rawCode como array; juntamos para string.
    if ($rawCode -is [array]) { $rawCode = ($rawCode -join "") }
    $code = "$rawCode".Trim()
    $body = ""
    if (Test-Path $bodyTmp) {
      $body = (Get-Content -Raw -Path $bodyTmp -ErrorAction SilentlyContinue)
      if ($null -eq $body) { $body = "" }
    }
    return @{ Code = $code; Body = $body.Trim() }
  } finally {
    Remove-Item $bodyTmp -ErrorAction SilentlyContinue
  }
}

# Resolve .env do mobile.
$envFile = Resolve-Path -ErrorAction SilentlyContinue `
  (Join-Path $PSScriptRoot "..\..\Pet_Marketplace_Mobile\.env")
if (-not $envFile) {
  Write-Fail "Nao encontrei o .env do mobile em ..\..\Pet_Marketplace_Mobile\.env"
  exit 1
}

$envText = Get-Content $envFile -Raw
$supabaseUrl = [regex]::Match($envText, 'EXPO_PUBLIC_SUPABASE_URL=([^\r\n]+)').Groups[1].Value
$anonKey     = [regex]::Match($envText, 'EXPO_PUBLIC_SUPABASE_ANON_KEY=([^\r\n]+)').Groups[1].Value

if (-not $supabaseUrl -or -not $anonKey) {
  Write-Fail "EXPO_PUBLIC_SUPABASE_URL ou ANON_KEY ausente no .env do mobile."
  exit 1
}
Write-Host "Supabase URL : $supabaseUrl" -ForegroundColor DarkGray
Write-Host "Anon key len : $($anonKey.Length)" -ForegroundColor DarkGray
Write-Host "API base     : $ApiBaseUrl" -ForegroundColor DarkGray

# ---------- LOGIN ----------
Write-Step "1/8 LOGIN" "POST $supabaseUrl/auth/v1/token?grant_type=password"
$loginBody = @{ email = $Email; password = $Password } | ConvertTo-Json -Compress
try {
  $loginResp = Invoke-RestMethod `
    -Method POST `
    -Uri "$supabaseUrl/auth/v1/token?grant_type=password" `
    -Headers @{ apikey = $anonKey; "Content-Type" = "application/json" } `
    -Body $loginBody
} catch {
  Write-Fail ("Login falhou: " + $_.Exception.Message)
  if ($_.ErrorDetails) { Write-Host $_.ErrorDetails.Message -ForegroundColor DarkRed }
  exit 1
}

$token = $loginResp.access_token
if (-not $token) {
  Write-Fail "Resposta de login sem access_token. Confira o e-mail/senha."
  exit 1
}
Write-OK "Token obtido. length=$($token.Length); user=$($loginResp.user.id)"

# ---------- IMAGEM ----------
if (-not $ImagePath) {
  $ImagePath = Join-Path $env:TEMP "smoke-avatar.jpg"
  Write-Step "2/8 IMAGEM" "Nenhuma imagem informada. Gerando JPG 512x512 em $ImagePath"
  Add-Type -AssemblyName System.Drawing
  $bmp = New-Object System.Drawing.Bitmap 512, 512
  $g   = [System.Drawing.Graphics]::FromImage($bmp)
  $g.Clear([System.Drawing.Color]::MediumPurple)
  $font  = New-Object System.Drawing.Font("Arial", 60, [System.Drawing.FontStyle]::Bold)
  $brush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::White)
  $g.DrawString("PET", $font, $brush, 130, 200)
  $bmp.Save($ImagePath, [System.Drawing.Imaging.ImageFormat]::Jpeg)
  $g.Dispose(); $bmp.Dispose()
  Write-OK "Imagem sintetica salva."
} else {
  Write-Step "2/8 IMAGEM" "Usando $ImagePath"
  if (-not (Test-Path $ImagePath)) {
    Write-Fail "Arquivo nao encontrado."; exit 1
  }
}

# ---------- SMOKE #1 ----------
Write-Step "3/8 SMOKE #1" "POST /me/avatar com imagem valida"
$r = Invoke-CurlCapture -Method POST -Url "$ApiBaseUrl/api/v1/me/avatar" -Token $token -FilePath $ImagePath
$uploadCode = $r.Code
$uploadBody = $r.Body
Write-Host "  HTTP $uploadCode"
Write-Host "  $uploadBody"
if ($uploadCode -eq "200" -and $uploadBody -match '"avatarUrl"') {
  Write-OK "Upload aceito + avatarUrl retornado."
} else {
  Write-Fail "Upload nao retornou 200 + avatarUrl."
}

# ---------- SMOKE #2 ----------
Write-Step "4/8 SMOKE #2" "GET /me deve devolver avatarUrl signed"
$r = Invoke-CurlCapture -Method GET -Url "$ApiBaseUrl/api/v1/me" -Token $token
$meCode = $r.Code
$meBody = $r.Body
Write-Host "  HTTP $meCode"
Write-Host "  $meBody"
if ($meCode -eq "200" -and $meBody -match '"avatarUrl":"https') {
  Write-OK "GET /me retornou signed URL."
} else {
  Write-Fail "GET /me sem avatarUrl signed."
}

# ---------- SMOKE #3 ----------
Write-Step "5/8 SMOKE #3" "POST /me/avatar com PDF deve retornar 415"
$pdfPath = Join-Path $env:TEMP "smoke-fake.pdf"
"%PDF-1.4 fake content for MIME-detection test" | Set-Content -Encoding ASCII $pdfPath
$r = Invoke-CurlCapture -Method POST -Url "$ApiBaseUrl/api/v1/me/avatar" -Token $token -FilePath $pdfPath
$pdfCode = $r.Code
Write-Host "  HTTP $pdfCode"
Write-Host "  $($r.Body)"
if ($pdfCode -eq "415") {
  Write-OK "PDF rejeitado com 415 (validacao MIME por magic bytes)."
} else {
  Write-Warn "Esperava 415, recebeu $pdfCode."
}

# ---------- SMOKE #4 ----------
Write-Step "6/8 SMOKE #4" "POST /me/avatar com 12 MB deve retornar 413"
$bigPath = Join-Path $env:TEMP "smoke-too-big.jpg"
$bytes = New-Object byte[] (12 * 1024 * 1024)
(New-Object Random).NextBytes($bytes)
[IO.File]::WriteAllBytes($bigPath, $bytes)
$r = Invoke-CurlCapture -Method POST -Url "$ApiBaseUrl/api/v1/me/avatar" -Token $token -FilePath $bigPath
$bigCode = $r.Code
Write-Host "  HTTP $bigCode"
if ($bigCode -eq "413") {
  Write-OK "12 MB rejeitado pelo multer (413 Payload Too Large)."
} elseif ($bigCode -eq "400" -or $bigCode -eq "415") {
  Write-OK "12 MB rejeitado com $bigCode (pode ser do nosso validador)."
} else {
  Write-Fail "Esperava 413/400/415, recebeu $bigCode."
}

# ---------- SMOKE #5 ----------
Write-Step "7/8 SMOKE #5" "DELETE /me/avatar deve retornar 204"
$r = Invoke-CurlCapture -Method DELETE -Url "$ApiBaseUrl/api/v1/me/avatar" -Token $token
$delCode = $r.Code
Write-Host "  HTTP $delCode"
if ($delCode -eq "204") {
  Write-OK "DELETE 204."
} else {
  Write-Fail "Esperava 204, recebeu $delCode."
}

# ---------- SMOKE #6 ----------
Write-Step "8/8 SMOKE #6" "DELETE /me/avatar de novo (idempotencia)"
$r = Invoke-CurlCapture -Method DELETE -Url "$ApiBaseUrl/api/v1/me/avatar" -Token $token
$del2Code = $r.Code
Write-Host "  HTTP $del2Code"
if ($del2Code -eq "204") {
  Write-OK "DELETE idempotente confirmado (204)."
} else {
  Write-Fail "Esperava 204, recebeu $del2Code."
}

# ---------- RESUMO ----------
Write-Host ""
Write-Host "==================== RESUMO ====================" -ForegroundColor Cyan
Write-Host ("  Smoke #1 Upload OK         : HTTP {0}" -f $uploadCode)
Write-Host ("  Smoke #2 GET /me           : HTTP {0}" -f $meCode)
Write-Host ("  Smoke #3 PDF rejeitado     : HTTP {0}  (esperado 415)" -f $pdfCode)
Write-Host ("  Smoke #4 12MB rejeitado    : HTTP {0}  (esperado 413/400/415)" -f $bigCode)
Write-Host ("  Smoke #5 DELETE            : HTTP {0}  (esperado 204)" -f $delCode)
Write-Host ("  Smoke #6 DELETE idempot.   : HTTP {0}  (esperado 204)" -f $del2Code)
Write-Host "================================================" -ForegroundColor Cyan
