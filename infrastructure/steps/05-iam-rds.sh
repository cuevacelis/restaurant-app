setup_iam_rds() {
  step "5/6  IAM — rol para que RDS invoque Lambda"

  RDS_ROLE_ARN=$(aws iam create-role \
    --profile "$PROFILE" \
    --role-name "$RDS_LAMBDA_ROLE_NAME" \
    --assume-role-policy-document '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"rds.amazonaws.com"},"Action":"sts:AssumeRole"}]}' \
    --query Role.Arn --output text 2>/dev/null \
    || aws iam get-role --profile "$PROFILE" \
       --role-name "$RDS_LAMBDA_ROLE_NAME" --query Role.Arn --output text)

  aws iam put-role-policy --profile "$PROFILE" \
    --role-name "$RDS_LAMBDA_ROLE_NAME" \
    --policy-name "RDSLambdaInvokePolicy" \
    --policy-document "{\"Version\":\"2012-10-17\",\"Statement\":[{\"Effect\":\"Allow\",\"Action\":[\"lambda:InvokeFunction\"],\"Resource\":\"$TRIGGER_ARN\"}]}"

  ok "Rol: $RDS_ROLE_ARN"

  info "Asociando rol a instancia RDS '$RDS_INSTANCE_ID'..."
  aws rds add-role-to-db-instance \
    --profile "$PROFILE" --region "$REGION" \
    --db-instance-identifier "$RDS_INSTANCE_ID" \
    --role-arn "$RDS_ROLE_ARN" \
    --feature-name Lambda 2>/dev/null \
    && ok "Rol asociado a RDS" || warn "Ya estaba asociado (o instancia no encontrada)"
}
