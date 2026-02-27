#!/usr/bin/env bash
# Activa la extensión aws_lambda e instala los triggers de tiempo real en RDS.
# Lee credenciales de .env.local automáticamente.
#
# Uso: pnpm db:triggers
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ENV_FILE="$SCRIPT_DIR/../.env.local"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Error: .env.local no encontrado" >&2
  exit 1
fi

set -o allexport
# shellcheck disable=SC1090
source "$ENV_FILE"
set +o allexport

source "$SCRIPT_DIR/lib/config.sh"

TRIGGER_ARN="arn:aws:lambda:${REGION}:${ACCOUNT_ID}:function:${TRIGGER_FN}"

export PGPASSWORD="$DB_PASSWORD"
PSQL="psql -h $DB_HOST -p ${DB_PORT:-5432} -U $DB_USER -d $DB_NAME"

step "Activando extensión aws_lambda en RDS..."
$PSQL -c "CREATE EXTENSION IF NOT EXISTS aws_lambda CASCADE;" \
  && ok "Extensión activa" || { echo "Error al activar extensión" >&2; exit 1; }

step "Instalando triggers de tiempo real..."
$PSQL -v lambda_arn="$TRIGGER_ARN" -f "$SCRIPT_DIR/sql/triggers.sql" \
  && ok "Triggers instalados" || { echo "Error al instalar triggers" >&2; exit 1; }

echo ""
echo -e "${GREEN}${BOLD}✅ Listo. Los cambios en pedidos ahora disparan WebSocket en tiempo real.${NC}"
