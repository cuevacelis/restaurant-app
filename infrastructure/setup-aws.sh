#!/usr/bin/env bash
# ============================================================
# Restaurant App — AWS Infrastructure
#
# Uso:
#   bash infrastructure/setup-aws.sh --stage=dev           # crear / actualizar dev
#   bash infrastructure/setup-aws.sh --stage=prd           # crear / actualizar prd
#   bash infrastructure/setup-aws.sh --stage=dev --destroy # eliminar dev
# ============================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# ── Parsear argumentos ───────────────────────────────────────
_DESTROY=false
for _arg in "$@"; do
  case "$_arg" in
    --stage=*) export AWS_STAGE="${_arg#--stage=}" ;;
    --destroy) _DESTROY=true ;;
  esac
done

# Cargar .env.local si existe (permite sobreescribir AWS_PROFILE, AWS_REGION, etc.)
# Los args de CLI tienen mayor prioridad porque se exportaron antes del source.
ENV_FILE="$SCRIPT_DIR/../.env.local"
if [[ -f "$ENV_FILE" ]]; then
  set -o allexport
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +o allexport
  # Restaurar el stage del arg CLI si fue pasado (el source puede haberlo pisado)
  for _arg in "$@"; do
    [[ "$_arg" == --stage=* ]] && export AWS_STAGE="${_arg#--stage=}"
  done
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
if [[ "$_DESTROY" == "true" ]]; then
  run_destroy
  exit 0
fi

# ── Modo setup ───────────────────────────────────────────────
echo -e "\n${BOLD}============================================================"
echo " Restaurant App — AWS Infrastructure Setup  [stage: ${STAGE}]"
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
echo "  Pasos siguientes (en orden):"
echo ""
echo "  1) Crear base de datos y schema:"
echo "       pnpm db:setup"
echo ""
echo "  2) Insertar datos iniciales (usuarios, mesas, menú):"
echo "       pnpm db:seed"
echo ""
echo "  3) Activar extensión e instalar triggers de tiempo real:"
echo "       pnpm db:triggers:${STAGE}"
echo ""
echo "  4) Iniciar la app:"
if [[ "$STAGE" == "dev" ]]; then
  echo "       pnpm dev"
else
  echo "       pnpm build && pnpm start"
fi
echo "============================================================"
