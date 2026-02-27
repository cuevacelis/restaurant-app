# Elimina un rol IAM con todas sus políticas
_delete_role() {
  local role="$1" policies inline
  policies=$(aws iam list-attached-role-policies --profile "$PROFILE" --role-name "$role" \
    --query 'AttachedPolicies[].PolicyArn' --output text 2>/dev/null || true)
  for p in $policies; do
    aws iam detach-role-policy --profile "$PROFILE" --role-name "$role" \
      --policy-arn "$p" 2>/dev/null || true
  done
  inline=$(aws iam list-role-policies --profile "$PROFILE" --role-name "$role" \
    --query PolicyNames --output text 2>/dev/null || true)
  for p in $inline; do
    aws iam delete-role-policy --profile "$PROFILE" --role-name "$role" \
      --policy-name "$p" 2>/dev/null || true
  done
  aws iam delete-role --profile "$PROFILE" --role-name "$role" 2>/dev/null \
    && ok "Rol eliminado: $role" || warn "Rol no encontrado: $role"
}

run_destroy() {
  echo -e "\n${RED}${BOLD}Eliminando todos los recursos AWS del restaurante...${NC}"
  read -rp "  ¿Confirmar? [y/N] " confirm
  [[ "$confirm" =~ ^[yY]$ ]] || { echo "Cancelado."; exit 0; }

  step "Desasociando rol de RDS..."
  aws rds remove-role-from-db-instance \
    --profile "$PROFILE" --region "$REGION" \
    --db-instance-identifier "$RDS_INSTANCE_ID" \
    --role-arn "arn:aws:iam::${ACCOUNT_ID}:role/${RDS_LAMBDA_ROLE_NAME}" \
    --feature-name Lambda 2>/dev/null && ok "Rol RDS removido" || warn "No estaba asociado"

  step "Eliminando funciones Lambda..."
  for FN in "$CONNECT_FN" "$DISCONNECT_FN" "$BROADCAST_FN" "$TRIGGER_FN"; do
    aws lambda delete-function --profile "$PROFILE" --region "$REGION" \
      --function-name "$FN" 2>/dev/null && ok "Eliminada: $FN" || warn "No encontrada: $FN"
  done

  step "Eliminando API Gateway WebSocket..."
  local API_ID
  API_ID=$(aws apigatewayv2 get-apis --profile "$PROFILE" --region "$REGION" \
    --query "Items[?Name=='${WS_API_NAME}'].ApiId" --output text 2>/dev/null | awk '{print $1}')
  if [[ -n "$API_ID" && "$API_ID" != "None" ]]; then
    aws apigatewayv2 delete-api --profile "$PROFILE" --region "$REGION" \
      --api-id "$API_ID" && ok "API Gateway eliminado ($API_ID)"
  else
    warn "API Gateway no encontrado"
  fi

  step "Eliminando tabla DynamoDB..."
  aws dynamodb delete-table --profile "$PROFILE" --region "$REGION" \
    --table-name "$CONNECTIONS_TABLE" 2>/dev/null && ok "Tabla eliminada" || warn "Tabla no encontrada"

  step "Eliminando roles IAM..."
  _delete_role "$LAMBDA_ROLE_NAME"
  _delete_role "$RDS_LAMBDA_ROLE_NAME"

  echo -e "\n${GREEN}${BOLD}✅ Teardown completo.${NC}\n"
}
