setup_iam_lambda() {
  step "2/6  IAM — rol de ejecución Lambda"

  LAMBDA_ROLE_ARN=$(aws iam create-role \
    --profile "$PROFILE" \
    --role-name "$LAMBDA_ROLE_NAME" \
    --assume-role-policy-document '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"lambda.amazonaws.com"},"Action":"sts:AssumeRole"}]}' \
    --query Role.Arn --output text 2>/dev/null \
    || aws iam get-role --profile "$PROFILE" \
       --role-name "$LAMBDA_ROLE_NAME" --query Role.Arn --output text)

  aws iam attach-role-policy --profile "$PROFILE" \
    --role-name "$LAMBDA_ROLE_NAME" \
    --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole 2>/dev/null || true

  aws iam attach-role-policy --profile "$PROFILE" \
    --role-name "$LAMBDA_ROLE_NAME" \
    --policy-arn arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess 2>/dev/null || true

  aws iam put-role-policy --profile "$PROFILE" \
    --role-name "$LAMBDA_ROLE_NAME" \
    --policy-name "RestaurantLambdaPolicy" \
    --policy-document '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Action":["lambda:InvokeFunction"],"Resource":"*"},{"Effect":"Allow","Action":["execute-api:ManageConnections"],"Resource":"*"}]}'

  ok "Rol: $LAMBDA_ROLE_ARN"
  info "Esperando 10s para propagación IAM..."
  sleep 10
}
