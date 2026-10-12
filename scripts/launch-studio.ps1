param([switch]$GitHub)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $projectRoot
$toolsDir = Join-Path $projectRoot '.tools'
New-Item -ItemType Directory -Force -Path $toolsDir | Out-Null
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$proxy = Get-ItemProperty -LiteralPath 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Internet Settings'
if ($proxy.ProxyEnable -eq 1 -and $proxy.ProxyServer -match '^127\.0\.0\.1:\d+$') {
  $env:HTTPS_PROXY = 'http://' + $proxy.ProxyServer
  $env:HTTP_PROXY = $env:HTTPS_PROXY
  $env:npm_config_proxy = $env:HTTPS_PROXY
  $env:npm_config_https_proxy = $env:HTTPS_PROXY
  git -c "safe.directory=$($projectRoot.Replace('\','/'))" config http.proxy $env:HTTPS_PROXY
}
function Get-VerifiedArchive($url, $checksums, $name, $destination) {
  $archive = Join-Path $toolsDir $name
  Invoke-WebRequest -UseBasicParsing -Uri $url -OutFile $archive
  $manifestFile = Join-Path $toolsDir ($name + '.sha256.txt')
  Invoke-WebRequest -UseBasicParsing -Uri $checksums -OutFile $manifestFile
  $manifest = Get-Content -LiteralPath $manifestFile -Raw
  $line = ($manifest -split "`n" | Where-Object { $_ -match ([regex]::Escape($name) + '$') } | Select-Object -First 1)
  if (-not $line) { throw 'Download checksum not found.' }
  $expected = ($line.Trim() -split '\s+')[0]
  if ((Get-FileHash -LiteralPath $archive -Algorithm SHA256).Hash.ToLower() -ne $expected.ToLower()) { throw 'Download checksum did not match.' }
  Expand-Archive -LiteralPath $archive -DestinationPath $destination -Force
}
$runtime = Join-Path $toolsDir 'node-v24.21.0-win-x64'
$node = Join-Path $runtime 'node.exe'
if (-not (Test-Path -LiteralPath $node)) {
  Write-Host 'Preparing the local Node.js runtime (first launch only)...'
  Get-VerifiedArchive 'https://nodejs.org/dist/v24.21.0/node-v24.21.0-win-x64.zip' 'https://nodejs.org/dist/v24.21.0/SHASUMS256.txt' 'node-v24.21.0-win-x64.zip' $toolsDir
}
$env:Path = $runtime + ';' + $env:Path
if ($GitHub) {
  $ghDir = Join-Path $toolsDir 'gh'
  $gh = Join-Path $ghDir 'bin\gh.exe'
  if (-not (Test-Path -LiteralPath $gh)) {
    Get-VerifiedArchive 'https://github.com/cli/cli/releases/download/v2.102.0/gh_2.102.0_windows_amd64.zip' 'https://github.com/cli/cli/releases/download/v2.102.0/gh_2.102.0_checksums.txt' 'gh_2.102.0_windows_amd64.zip' $ghDir
  }
  & $gh auth login --hostname github.com --web --git-protocol https
  if ($LASTEXITCODE -ne 0) { throw 'GitHub sign-in was not completed.' }
  & $gh auth setup-git
  if ($LASTEXITCODE -ne 0) { throw 'Could not connect Git to the GitHub credential manager.' }
  $safeRoot = "safe.directory=$($projectRoot.Replace('\','/'))"
  $gitName = git -c $safeRoot config user.name
  $gitEmail = git -c $safeRoot config user.email
  if (-not $gitName -or -not $gitEmail) {
    $account = (& $gh api user | ConvertFrom-Json)
    if ($LASTEXITCODE -ne 0) { throw 'Could not read the signed-in GitHub account.' }
    if (-not $gitName) { git -c $safeRoot config user.name $account.login }
    if (-not $gitEmail) { git -c $safeRoot config user.email "$($account.id)+$($account.login)@users.noreply.github.com" }
  }
  & $gh auth status
  exit $LASTEXITCODE
}
$lockHash = (Get-FileHash -LiteralPath 'package-lock.json' -Algorithm SHA256).Hash
$stamp = Join-Path $toolsDir 'dependencies.txt'
if (-not (Test-Path 'node_modules/astro/astro.js') -or -not (Test-Path $stamp) -or (Get-Content $stamp -Raw).Trim() -ne $lockHash) {
  Write-Host 'Preparing the writing tools...'
  & (Join-Path $runtime 'npm.cmd') ci --no-audit --no-fund
  if ($LASTEXITCODE -ne 0) { throw 'Dependency installation failed. Your articles were not changed.' }
  Set-Content -LiteralPath $stamp -Value $lockHash
}
$studioDir = Join-Path $projectRoot '.studio'
New-Item -ItemType Directory -Force -Path $studioDir | Out-Null
$ready = $false
try { $response = Invoke-WebRequest -UseBasicParsing -Uri 'http://127.0.0.1:4321/studio/' -TimeoutSec 3; $ready = $response.Content -match 'Blog Studio' } catch {}
if (-not $ready) {
  $process = Start-Process -FilePath $node -ArgumentList 'scripts/start-studio.mjs' -WorkingDirectory $projectRoot -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $studioDir 'server.log') -RedirectStandardError (Join-Path $studioDir 'server-error.log')
  Set-Content -LiteralPath (Join-Path $studioDir 'server.pid') -Value $process.Id
  for ($attempt=0; $attempt -lt 40; $attempt++) {
    Start-Sleep -Milliseconds 750
    try { $response = Invoke-WebRequest -UseBasicParsing -Uri 'http://127.0.0.1:4321/studio/' -TimeoutSec 2; if ($response.Content -match 'Blog Studio') { $ready = $true; break } } catch {}
    if ($process.HasExited) { break }
  }
}
if (-not $ready) { throw 'Studio could not start. See .studio/server-error.log. Port 4321 may already be in use.' }
Start-Process 'http://127.0.0.1:4321/studio/'
