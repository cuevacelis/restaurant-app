# deploy_lambda <nombre> <handler> <archivo.mjs> <ENV_KEY=val,...>
# Imprime el ARN en stdout; los logs van a stderr.
deploy_lambda() {
  local name="$1" handler="$2" file="$3" env_vars="$4"
  local zip="${SCRIPT_DIR}/lambda/${file%.mjs}.zip"

  zip -j "$zip" "${SCRIPT_DIR}/lambda/$file" >/dev/null 2>&1

  local arn
  if arn=$(aws lambda create-function \
    --profile "$PROFILE" --region "$REGION" \
    --function-name "$name" \
    --runtime nodejs22.x \
    --role "$LAMBDA_ROLE_ARN" \
    --handler "$handler" \
    --zip-file "fileb://$zip" \
    --environment "Variables={$env_vars}" \
    --query FunctionArn --output text 2>/dev/null); then
    ok "$name → creada"
  else
    # Función ya existe: actualizar código, esperar, luego actualizar variables
    aws lambda update-function-code \
      --profile "$PROFILE" --region "$REGION" \
      --function-name "$name" \
      --zip-file "fileb://$zip" >/dev/null 2>&1
    aws lambda wait function-updated \
      --profile "$PROFILE" --region "$REGION" \
      --function-name "$name" 2>/dev/null || true
    aws lambda update-function-configuration \
      --profile "$PROFILE" --region "$REGION" \
      --function-name "$name" \
      --environment "Variables={$env_vars}" >/dev/null 2>&1
    arn=$(aws lambda get-function \
      --profile "$PROFILE" --region "$REGION" \
      --function-name "$name" --query Configuration.FunctionArn --output text)
    ok "$name → actualizada"
  fi

  echo "$arn"
}

setup_lambdas() {
  step "3/6  Lambda — empaquetar y desplegar funciones"

  CONNECT_ARN=$(deploy_lambda \
    "$CONNECT_FN" "websocket-connect.handler" "websocket-connect.mjs" \
    "CONNECTIONS_TABLE=$CONNECTIONS_TABLE")

  DISCONNECT_ARN=$(deploy_lambda \
    "$DISCONNECT_FN" "websocket-disconnect.handler" "websocket-disconnect.mjs" \
    "CONNECTIONS_TABLE=$CONNECTIONS_TABLE")

  BROADCAST_ARN=$(deploy_lambda \
    "$BROADCAST_FN" "websocket-broadcast.handler" "websocket-broadcast.mjs" \
    "CONNECTIONS_TABLE=$CONNECTIONS_TABLE,WEBSOCKET_ENDPOINT=PLACEHOLDER")

  TRIGGER_ARN=$(deploy_lambda \
    "$TRIGGER_FN" "db-trigger-handler.handler" "db-trigger-handler.mjs" \
    "BROADCAST_FUNCTION_NAME=$BROADCAST_FN")
}
