#!/usr/bin/env bash
# ============================================================
# Restaurant App — AWS Infrastructure
#
# Uso:
#   bash infrastructure/setup-aws.sh           # crear / actualizar
#   bash infrastructure/setup-aws.sh --destroy # eliminar todo
# ============================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Cargar .env.local si existe (permite sobreescribir AWS_PROFILE, AWS_REGION, etc.)
ENV_FILE="$SCRIPT_DIR/../.env.local"
if [[ -f "$ENV_FILE" ]]; then
  set -o allexport
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +o allexport
fi

source "$SCRIPT_DIR/lib/config.sh"
source "$SCRIPT_DIR/lib/destroy.sh"
source "$SCRIPT_DIR/steps/01-dynamodb.sh"
source "$SCRIPT_DIR/steps/02-iam-lambda.sh"
source "$SCRIPT_DIR/steps/03-lambdas.sh"
source "$SCRIPT_DIR/steps/04-api-gateway.sh"
source "$SCRIPT_DIR/steps/05-iam-rds.sh"
source "$SCRIPT_DIR/steps/06-patch-config.sh"

# ── Modo --destroy ───────────────────────────────────────────
if [[ "${1:-}" == "--destroy" ]]; then
  run_destroy
  exit 0
fi

# ── Modo setup ───────────────────────────────────────────────
echo -e "\n${BOLD}============================================================"
echo " Restaurant App — AWS Infrastructure Setup"
echo " Account: $ACCOUNT_ID | Region: $REGION"
echo -e "============================================================${NC}"

setup_dynamodb       # 1/6 — DynamoDB
setup_iam_lambda     # 2/6 — IAM rol Lambda
setup_lambdas        # 3/6 — Lambda functions
setup_api_gateway    # 4/6 — API Gateway WebSocket
setup_iam_rds        # 5/6 — IAM rol RDS
patch_config         # 6/6 — triggers.sql + .env.local

echo -e "\n${GREEN}${BOLD}============================================================"
echo " ✅ SETUP COMPLETO"
echo -e "============================================================${NC}"
echo "  WebSocket URL:  $WS_WSS_URL"
echo ""
echo "  Paso pendiente: ejecutar triggers.sql en RDS"
echo "  (El ARN se pasa como variable — no hay nada hardcodeado)"
echo ""
echo -e "  ${YELLOW}psql -h \$DB_HOST -U \$DB_USER -d \$DB_NAME \\"
echo -e "    -v lambda_arn='${TRIGGER_ARN}' \\"
echo -e "    -f infrastructure/sql/triggers.sql${NC}"
echo ""
echo "  Si la extensión aws_lambda no está activa, primero:"
echo "    CREATE EXTENSION IF NOT EXISTS aws_lambda CASCADE;"
echo "============================================================"
