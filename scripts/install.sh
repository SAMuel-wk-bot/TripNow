#!/usr/bin/env bash
# TripNow installer for Linux & macOS.
# Verifies prerequisites, configures env files, installs dependencies,
# starts Postgres+Redis via Docker, and initializes the database.
set -euo pipefail

# ---------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
info()  { printf "${BLUE}ℹ %s${NC}\n" "$1"; }
ok()    { printf "${GREEN}✓ %s${NC}\n" "$1"; }
warn()  { printf "${YELLOW}⚠ %s${NC}\n" "$1"; }
err()   { printf "${RED}✗ %s${NC}\n" "$1" >&2; }

have()  { command -v "$1" >/dev/null 2>&1; }

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

OS="$(uname -s)"
case "$OS" in
  Linux*)  PLATFORM=linux ;;
  Darwin*) PLATFORM=macos ;;
  *)       err "Sistema no soportado por este script: $OS"; exit 1 ;;
esac
info "Plataforma detectada: $PLATFORM"

# ---------------------------------------------------------------
# 1. Check / install prerequisites
# ---------------------------------------------------------------
install_hint() {
  local tool="$1"
  case "$PLATFORM" in
    macos)
      echo "  brew install $tool" ;;
    linux)
      if have apt-get; then echo "  sudo apt-get update && sudo apt-get install -y $tool"
      elif have dnf; then    echo "  sudo dnf install -y $tool"
      elif have pacman; then echo "  sudo pacman -S $tool"
      else                   echo "  (instala $tool con tu gestor de paquetes)"
      fi ;;
  esac
}

check_tool() {
  local tool="$1"; local label="${2:-$1}"
  if have "$tool"; then ok "$label encontrado: $(command -v "$tool")"
  else
    err "$label no está instalado."
    echo "  Instálalo con:"
    install_hint "$tool"
    return 1
  fi
}

MISSING=0
check_tool git       Git       || MISSING=1
check_tool curl      curl      || MISSING=1
check_tool docker    Docker    || MISSING=1

# Docker compose puede venir como `docker compose` (v2) o `docker-compose` (v1)
if docker compose version >/dev/null 2>&1; then
  COMPOSE_CMD="docker compose"
  ok "Docker Compose v2 detectado"
elif have docker-compose; then
  COMPOSE_CMD="docker-compose"
  ok "Docker Compose v1 detectado"
else
  err "Docker Compose no está instalado."
  echo "  En Docker Desktop ya viene incluido. En Linux:"
  echo "  sudo apt-get install -y docker-compose-plugin"
  MISSING=1
fi

# Node.js 20+
if have node; then
  NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
  if [[ "$NODE_MAJOR" -ge 20 ]]; then
    ok "Node.js $(node -v) (>=20)"
  else
    err "Node.js $(node -v) detectado, se necesita 20+."
    case "$PLATFORM" in
      macos) echo "  brew install node@20 && brew link --overwrite node@20" ;;
      linux) echo "  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt-get install -y nodejs" ;;
    esac
    MISSING=1
  fi
else
  err "Node.js no está instalado."
  case "$PLATFORM" in
    macos) echo "  brew install node@20" ;;
    linux) echo "  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt-get install -y nodejs" ;;
  esac
  MISSING=1
fi

if [[ $MISSING -ne 0 ]]; then
  err "Instala los requisitos anteriores y vuelve a ejecutar este script."
  exit 1
fi

# Docker daemon corriendo?
if ! docker info >/dev/null 2>&1; then
  err "Docker está instalado pero el daemon no responde."
  echo "  Inicia Docker Desktop o el servicio: sudo systemctl start docker"
  exit 1
fi
ok "Docker daemon respondiendo"

# ---------------------------------------------------------------
# 2. .env files
# ---------------------------------------------------------------
setup_env() {
  local example="$1"; local target="${1%.example}"
  if [[ -f "$target" ]]; then
    info "$target ya existe, no se sobrescribe"
  else
    cp "$example" "$target"
    ok "Creado $target desde $example"
  fi
}

[[ -f .env.example ]]            && setup_env .env.example
[[ -f backend/.env.example ]]    && setup_env backend/.env.example
[[ -f frontend/.env.example ]]   && setup_env frontend/.env.example

# ---------------------------------------------------------------
# 3. npm install (workspaces)
# ---------------------------------------------------------------
info "Instalando dependencias npm (workspaces)…"
npm install
ok "Dependencias instaladas"

# ---------------------------------------------------------------
# 4. Servicios de BD (Postgres + Redis)
# ---------------------------------------------------------------
info "Levantando Postgres y Redis con Docker…"
$COMPOSE_CMD up -d postgres redis
ok "Contenedores arrancados"

info "Esperando a que Postgres esté listo…"
ATTEMPTS=0
until $COMPOSE_CMD exec -T postgres pg_isready -U tripnow >/dev/null 2>&1; do
  ATTEMPTS=$((ATTEMPTS+1))
  if [[ $ATTEMPTS -gt 30 ]]; then
    err "Postgres no respondió a tiempo. Revisa los logs:"
    echo "  $COMPOSE_CMD logs postgres"
    exit 1
  fi
  sleep 1
done
ok "Postgres listo"

# ---------------------------------------------------------------
# 5. Prisma: generate + migrate + seed
# ---------------------------------------------------------------
info "Generando cliente Prisma…"
npm --workspace backend exec -- prisma generate
ok "Cliente Prisma generado"

info "Aplicando migraciones…"
if ! npm --workspace backend exec -- prisma migrate deploy; then
  warn "migrate deploy falló, intentando migrate dev…"
  npm --workspace backend exec -- prisma migrate dev --name init --skip-seed
fi
ok "Migraciones aplicadas"

info "Sembrando datos de ejemplo…"
npm --workspace backend run prisma:seed
ok "Datos sembrados"

# ---------------------------------------------------------------
# 6. Hecho
# ---------------------------------------------------------------
cat <<EOF

${GREEN}✅ Instalación completada${NC}

Próximos pasos:
  1) Arranca el backend y el frontend en paralelo:
       npm run dev

  2) Abre la app:
       Frontend → http://localhost:5173
       API      → http://localhost:4000/api/health

Usuarios sembrados (password Tripnow123!):
  admin@tripnow.local   (ADMIN)
  agent@tripnow.local   (AGENT)
  alice@example.com     (USER)
  bob@example.com       (USER)

Comandos útiles:
  $COMPOSE_CMD logs -f postgres        # logs de la BD
  $COMPOSE_CMD down                    # parar todo
  npm --workspace backend run prisma:studio   # GUI de Prisma
EOF
