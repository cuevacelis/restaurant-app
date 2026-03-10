# ── Configuración (sobreescribible desde .env.local o variables de entorno) ───
PROFILE="${AWS_PROFILE:-default}"
REGION="${AWS_REGION:-us-east-1}"
STAGE="${AWS_STAGE:-dev}"
RDS_INSTANCE_ID="${AWS_RDS_INSTANCE_ID:-restaurant}"

if [[ "$STAGE" != "dev" && "$STAGE" != "prd" ]]; then
  echo "Error: STAGE debe ser 'dev' o 'prd' (recibido: '$STAGE')" >&2
  exit 1
fi

CONNECTIONS_TABLE="RestaurantWebSocketConnections-${STAGE}"
WS_API_NAME="restaurant-websocket-api-${STAGE}"
CONNECT_FN="restaurant-ws-connect-${STAGE}"
DISCONNECT_FN="restaurant-ws-disconnect-${STAGE}"
BROADCAST_FN="restaurant-ws-broadcast-${STAGE}"
TRIGGER_FN="restaurant-db-trigger-${STAGE}"
LAMBDA_ROLE_NAME="restaurant-lambda-role-${STAGE}"
RDS_LAMBDA_ROLE_NAME="restaurant-rds-lambda-role-${STAGE}"

# ── Colores ───────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; BOLD='\033[1m'; NC='\033[0m'

# ── Output helpers (stderr para no interferir con $()) ────────
ok()   { echo -e "  ${GREEN}✓${NC} $*" >&2; }
warn() { echo -e "  ${YELLOW}⚠${NC}  $*" >&2; }
info() { echo -e "  ${BLUE}→${NC} $*" >&2; }
step() { echo -e "\n${BOLD}▶ $*${NC}" >&2; }

ACCOUNT_ID=$(aws sts get-caller-identity --profile "$PROFILE" --query Account --output text)
