# Permisos Lambda para API Gateway (idempotente: eliminar y volver a añadir)
_set_lambda_permission() {
  local fn_name="$1" stmt="apigw-ws-invoke"
  aws lambda remove-permission --profile "$PROFILE" --region "$REGION" \
    --function-name "$fn_name" --statement-id "$stmt" 2>/dev/null || true
  aws lambda add-permission \
    --profile "$PROFILE" --region "$REGION" \
    --function-name "$fn_name" --statement-id "$stmt" \
    --action "lambda:InvokeFunction" \
    --principal "apigateway.amazonaws.com" \
    --source-arn "arn:aws:execute-api:${REGION}:${ACCOUNT_ID}:${WS_API_ID}/*/*" >/dev/null
}

setup_api_gateway() {
  step "4/6  API Gateway — WebSocket API y rutas"

  WS_API_ID=$(aws apigatewayv2 create-api \
    --profile "$PROFILE" --region "$REGION" \
    --name "$WS_API_NAME" \
    --protocol-type WEBSOCKET \
    --route-selection-expression '$request.body.action' \
    --query ApiId --output text 2>/dev/null \
    || aws apigatewayv2 get-apis \
       --profile "$PROFILE" --region "$REGION" \
       --query "Items[?Name=='${WS_API_NAME}'].ApiId" --output text | awk '{print $1}')

  WS_ENDPOINT="https://${WS_API_ID}.execute-api.${REGION}.amazonaws.com/${STAGE}"
  WS_WSS_URL="wss://${WS_API_ID}.execute-api.${REGION}.amazonaws.com/${STAGE}"
  ok "API ID: $WS_API_ID"

  _set_lambda_permission "$CONNECT_FN"
  _set_lambda_permission "$DISCONNECT_FN"

  # Limpiar rutas e integraciones existentes para re-creación limpia
  for route_id in $(aws apigatewayv2 get-routes \
    --profile "$PROFILE" --region "$REGION" --api-id "$WS_API_ID" \
    --query 'Items[].RouteId' --output text 2>/dev/null); do
    aws apigatewayv2 delete-route --profile "$PROFILE" --region "$REGION" \
      --api-id "$WS_API_ID" --route-id "$route_id" 2>/dev/null || true
  done
  for int_id in $(aws apigatewayv2 get-integrations \
    --profile "$PROFILE" --region "$REGION" --api-id "$WS_API_ID" \
    --query 'Items[].IntegrationId' --output text 2>/dev/null); do
    aws apigatewayv2 delete-integration --profile "$PROFILE" --region "$REGION" \
      --api-id "$WS_API_ID" --integration-id "$int_id" 2>/dev/null || true
  done

  local CONNECT_INT DISCONNECT_INT
  CONNECT_INT=$(aws apigatewayv2 create-integration \
    --profile "$PROFILE" --region "$REGION" --api-id "$WS_API_ID" \
    --integration-type AWS_PROXY \
    --integration-uri "arn:aws:apigateway:${REGION}:lambda:path/2015-03-31/functions/${CONNECT_ARN}/invocations" \
    --query IntegrationId --output text)

  DISCONNECT_INT=$(aws apigatewayv2 create-integration \
    --profile "$PROFILE" --region "$REGION" --api-id "$WS_API_ID" \
    --integration-type AWS_PROXY \
    --integration-uri "arn:aws:apigateway:${REGION}:lambda:path/2015-03-31/functions/${DISCONNECT_ARN}/invocations" \
    --query IntegrationId --output text)

  aws apigatewayv2 create-route --profile "$PROFILE" --region "$REGION" \
    --api-id "$WS_API_ID" --route-key '$connect' \
    --target "integrations/$CONNECT_INT" >/dev/null

  aws apigatewayv2 create-route --profile "$PROFILE" --region "$REGION" \
    --api-id "$WS_API_ID" --route-key '$disconnect' \
    --target "integrations/$DISCONNECT_INT" >/dev/null

  ok 'Rutas $connect / $disconnect creadas'

  aws apigatewayv2 create-stage \
    --profile "$PROFILE" --region "$REGION" \
    --api-id "$WS_API_ID" --stage-name "$STAGE" --auto-deploy 2>/dev/null \
  || aws apigatewayv2 update-stage \
    --profile "$PROFILE" --region "$REGION" \
    --api-id "$WS_API_ID" --stage-name "$STAGE" --auto-deploy >/dev/null
  ok "Stage '$STAGE' desplegado"

  # Actualizar broadcast Lambda con el endpoint real del WebSocket
  aws lambda wait function-updated \
    --profile "$PROFILE" --region "$REGION" \
    --function-name "$BROADCAST_FN" 2>/dev/null || true
  aws lambda update-function-configuration \
    --profile "$PROFILE" --region "$REGION" \
    --function-name "$BROADCAST_FN" \
    --environment "Variables={CONNECTIONS_TABLE=$CONNECTIONS_TABLE,WEBSOCKET_ENDPOINT=$WS_ENDPOINT}" >/dev/null
  ok "Broadcast Lambda → $WS_ENDPOINT"
}
