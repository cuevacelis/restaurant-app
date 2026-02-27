setup_dynamodb() {
  step "1/6  DynamoDB — tabla de conexiones WebSocket"
  aws dynamodb create-table \
    --profile "$PROFILE" --region "$REGION" \
    --table-name "$CONNECTIONS_TABLE" \
    --attribute-definitions AttributeName=connectionId,AttributeType=S \
    --key-schema AttributeName=connectionId,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST \
    --time-to-live-specification Enabled=true,AttributeName=ttl \
    2>/dev/null && ok "Tabla creada" || ok "Tabla ya existe"
}
