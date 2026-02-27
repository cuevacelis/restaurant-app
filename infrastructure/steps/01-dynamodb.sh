setup_dynamodb() {
  step "1/6  DynamoDB — tabla de conexiones WebSocket"
  local out
  if out=$(aws dynamodb create-table \
    --profile "$PROFILE" --region "$REGION" \
    --table-name "$CONNECTIONS_TABLE" \
    --attribute-definitions AttributeName=connectionId,AttributeType=S \
    --key-schema AttributeName=connectionId,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST 2>&1); then
    # Habilitar TTL en tabla recién creada (comando separado, no parámetro de create-table)
    aws dynamodb update-time-to-live \
      --profile "$PROFILE" --region "$REGION" \
      --table-name "$CONNECTIONS_TABLE" \
      --time-to-live-specification Enabled=true,AttributeName=ttl \
      > /dev/null 2>&1 || true
    ok "Tabla creada"
  elif echo "$out" | grep -q "ResourceInUseException"; then
    ok "Tabla ya existe"
  else
    echo "$out" >&2
    return 1
  fi
}
