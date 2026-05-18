# TripNow installer for Windows (PowerShell).
# Run from the repo root in an elevated or normal PowerShell:
#   powershell -ExecutionPolicy Bypass -File scripts\install.ps1

$ErrorActionPreference = 'Stop'

function Info($m) { Write-Host "ℹ $m" -ForegroundColor Blue }
function Ok($m)   { Write-Host "✓ $m" -ForegroundColor Green }
function Warn($m) { Write-Host "⚠ $m" -ForegroundColor Yellow }
function Err($m)  { Write-Host "✗ $m" -ForegroundColor Red }

function Test-Cmd($name) {
  return [bool](Get-Command $name -ErrorAction SilentlyContinue)
}

# ----------------------------------------------------------------
# Move to repo root
# ----------------------------------------------------------------
$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
Set-Location $RepoRoot
Info "Repositorio: $RepoRoot"

# ----------------------------------------------------------------
# 1. Prerequisites
# ----------------------------------------------------------------
$missing = $false

function Require-Tool($cmd, $label, $wingetId) {
  if (Test-Cmd $cmd) {
    Ok "$label encontrado"
  } else {
    Err "$label no está instalado."
    Write-Host "  Instálalo con: winget install --id $wingetId"
    $script:missing = $true
  }
}

Require-Tool 'git'    'Git'    'Git.Git'
Require-Tool 'docker' 'Docker' 'Docker.DockerDesktop'

# Node.js 20+
if (Test-Cmd 'node') {
  $nodeVersion = (node -v).TrimStart('v')
  $major = [int]($nodeVersion.Split('.')[0])
  if ($major -ge 20) {
    Ok "Node.js v$nodeVersion (>=20)"
  } else {
    Err "Node.js v$nodeVersion detectado, se necesita 20+."
    Write-Host "  Instálalo con: winget install --id OpenJS.NodeJS.LTS"
    $missing = $true
  }
} else {
  Err "Node.js no está instalado."
  Write-Host "  Instálalo con: winget install --id OpenJS.NodeJS.LTS"
  $missing = $true
}

# Docker compose v2
$composeOk = $false
try {
  & docker compose version | Out-Null
  $composeOk = $true
  Ok 'Docker Compose v2 detectado'
} catch {
  if (Test-Cmd 'docker-compose') {
    $composeOk = $true
    Ok 'Docker Compose v1 detectado'
  }
}
if (-not $composeOk) {
  Err 'Docker Compose no disponible. Asegúrate de tener Docker Desktop instalado y corriendo.'
  $missing = $true
}

if ($missing) {
  Err 'Instala los requisitos anteriores y vuelve a ejecutar este script.'
  exit 1
}

# Docker daemon corriendo
try {
  docker info | Out-Null
  Ok 'Docker daemon respondiendo'
} catch {
  Err 'Docker está instalado pero el daemon no responde.'
  Write-Host '  Abre Docker Desktop y espera a que termine de iniciar.'
  exit 1
}

# ----------------------------------------------------------------
# 2. .env files
# ----------------------------------------------------------------
function Setup-Env($example) {
  $target = $example -replace '\.example$', ''
  if (Test-Path $target) {
    Info "$target ya existe, no se sobrescribe"
  } else {
    Copy-Item $example $target
    Ok "Creado $target"
  }
}

if (Test-Path '.env.example')          { Setup-Env '.env.example' }
if (Test-Path 'backend\.env.example')  { Setup-Env 'backend\.env.example' }
if (Test-Path 'frontend\.env.example') { Setup-Env 'frontend\.env.example' }

# ----------------------------------------------------------------
# 3. npm install
# ----------------------------------------------------------------
Info 'Instalando dependencias npm (workspaces)…'
npm install
if ($LASTEXITCODE -ne 0) { Err 'npm install falló'; exit 1 }
Ok 'Dependencias instaladas'

# ----------------------------------------------------------------
# 4. Postgres + Redis
# ----------------------------------------------------------------
Info 'Levantando Postgres y Redis con Docker…'
docker compose up -d postgres redis
if ($LASTEXITCODE -ne 0) { Err 'docker compose up falló'; exit 1 }
Ok 'Contenedores arrancados'

Info 'Esperando a que Postgres esté listo…'
$attempts = 0
while ($true) {
  $attempts++
  try {
    docker compose exec -T postgres pg_isready -U tripnow | Out-Null
    if ($LASTEXITCODE -eq 0) { break }
  } catch { }
  if ($attempts -gt 30) {
    Err 'Postgres no respondió a tiempo. Revisa: docker compose logs postgres'
    exit 1
  }
  Start-Sleep -Seconds 1
}
Ok 'Postgres listo'

# ----------------------------------------------------------------
# 5. Prisma
# ----------------------------------------------------------------
Info 'Generando cliente Prisma…'
npm --workspace backend exec -- prisma generate
if ($LASTEXITCODE -ne 0) { Err 'prisma generate falló'; exit 1 }

Info 'Aplicando migraciones…'
npm --workspace backend exec -- prisma migrate deploy
if ($LASTEXITCODE -ne 0) {
  Warn 'migrate deploy falló, intentando migrate dev…'
  npm --workspace backend exec -- prisma migrate dev --name init --skip-seed
  if ($LASTEXITCODE -ne 0) { Err 'Las migraciones fallaron.'; exit 1 }
}
Ok 'Migraciones aplicadas'

Info 'Sembrando datos de ejemplo…'
npm --workspace backend run prisma:seed
if ($LASTEXITCODE -ne 0) { Err 'El seed falló.'; exit 1 }
Ok 'Datos sembrados'

# ----------------------------------------------------------------
# Done
# ----------------------------------------------------------------
Write-Host ''
Write-Host '✅ Instalación completada' -ForegroundColor Green
Write-Host ''
Write-Host 'Próximos pasos:'
Write-Host '  1) Arranca backend + frontend:'
Write-Host '       npm run dev'
Write-Host ''
Write-Host '  2) Abre la app:'
Write-Host '       Frontend → http://localhost:5173'
Write-Host '       API      → http://localhost:4000/api/health'
Write-Host ''
Write-Host 'Usuarios sembrados (password Tripnow123!):'
Write-Host '  admin@tripnow.local   (ADMIN)'
Write-Host '  agent@tripnow.local   (AGENT)'
Write-Host '  alice@example.com     (USER)'
Write-Host '  bob@example.com       (USER)'
