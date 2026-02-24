#!/usr/bin/env bash
# ============================================================
# Restaurant App - AWS Infrastructure Setup
# Usage: bash infrastructure/setup-aws.sh
# Requirements: AWS CLI installed, configured with --profile default
# Region: us-east-1
# ============================================================
set -euo pipefail

PROFILE="default"
REGION="us-east-1"
ACCOUNT_ID=$(aws sts get-caller-identity --profile $PROFILE --query Account --output text)

echo "============================================================"
echo " Restaurant App - AWS Infrastructure Setup"
echo " Account: $ACCOUNT_ID | Region: $REGION"
echo "============================================================"

# ── Names ───────────────────────────────────────────────────
CONNECTIONS_TABLE="RestaurantWebSocketConnections"
WS_API_NAME="restaurant-websocket-api"
CONNECT_FN="restaurant-ws-connect"
DISCONNECT_FN="restaurant-ws-disconnect"
BROADCAST_FN="restaurant-ws-broadcast"
TRIGGER_FN="restaurant-db-trigger"
LAMBDA_ROLE_NAME="restaurant-lambda-role"
RDS_LAMBDA_ROLE_NAME="restaurant-rds-lambda-role"
STAGE="prod"

echo ""
echo "▶ 1/8  Creating DynamoDB table for WebSocket connections..."
aws dynamodb create-table \
  --profile $PROFILE --region $REGION \
  --table-name "$CONNECTIONS_TABLE" \
  --attribute-definitions AttributeName=connectionId,AttributeType=S \
  --key-schema AttributeName=connectionId,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --time-to-live-specification Enabled=true,AttributeName=ttl \
  2>/dev/null && echo "  ✓ Table created" || echo "  ⚠ Table may already exist, skipping"

echo ""
echo "▶ 2/8  Creating IAM role for Lambda functions..."
TRUST_POLICY='{
  "Version":"2012-10-17",
  "Statement":[{
    "Effect":"Allow",
    "Principal":{"Service":"lambda.amazonaws.com"},
    "Action":"sts:AssumeRole"
  }]
}'

LAMBDA_ROLE_ARN=$(aws iam create-role \
  --profile $PROFILE \
  --role-name "$LAMBDA_ROLE_NAME" \
  --assume-role-policy-document "$TRUST_POLICY" \
  --query Role.Arn --output text 2>/dev/null \
  || aws iam get-role --profile $PROFILE --role-name "$LAMBDA_ROLE_NAME" \
     --query Role.Arn --output text)

echo "  ✓ Lambda Role ARN: $LAMBDA_ROLE_ARN"

# Attach managed policies
aws iam attach-role-policy --profile $PROFILE \
  --role-name "$LAMBDA_ROLE_NAME" \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole \
  2>/dev/null || true

aws iam attach-role-policy --profile $PROFILE \
  --role-name "$LAMBDA_ROLE_NAME" \
  --policy-arn arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess \
  2>/dev/null || true

# Inline policy: allow invoking other Lambda functions + API Gateway Management
aws iam put-role-policy --profile $PROFILE \
  --role-name "$LAMBDA_ROLE_NAME" \
  --policy-name "RestaurantLambdaPolicy" \
  --policy-document '{
    "Version":"2012-10-17",
    "Statement":[
      {"Effect":"Allow","Action":["lambda:InvokeFunction"],"Resource":"*"},
      {"Effect":"Allow","Action":["execute-api:ManageConnections"],"Resource":"*"}
    ]
  }'

echo "  ✓ Policies attached"
echo "  ⏳ Waiting 15s for IAM propagation..."
sleep 15

echo ""
echo "▶ 3/8  Creating Lambda functions..."

# -- Package Lambda functions --
cd "$(dirname "$0")/lambda"

create_lambda_zip() {
  local file="$1"
  local zipname="${file%.mjs}.zip"
  zip -j "$zipname" "$file" >/dev/null
  echo "$zipname"
}

# websocket-connect
zip_connect=$(create_lambda_zip "websocket-connect.mjs")
CONNECT_ARN=$(aws lambda create-function \
  --profile $PROFILE --region $REGION \
  --function-name "$CONNECT_FN" \
  --runtime nodejs22.x \
  --role "$LAMBDA_ROLE_ARN" \
  --handler "websocket-connect.handler" \
  --zip-file "fileb://$zip_connect" \
  --environment "Variables={CONNECTIONS_TABLE=$CONNECTIONS_TABLE}" \
  --query FunctionArn --output text 2>/dev/null \
|| aws lambda update-function-code \
  --profile $PROFILE --region $REGION \
  --function-name "$CONNECT_FN" \
  --zip-file "fileb://$zip_connect" \
  --query FunctionArn --output text)
echo "  ✓ $CONNECT_FN: $CONNECT_ARN"

# websocket-disconnect
zip_disconnect=$(create_lambda_zip "websocket-disconnect.mjs")
DISCONNECT_ARN=$(aws lambda create-function \
  --profile $PROFILE --region $REGION \
  --function-name "$DISCONNECT_FN" \
  --runtime nodejs22.x \
  --role "$LAMBDA_ROLE_ARN" \
  --handler "websocket-disconnect.handler" \
  --zip-file "fileb://$zip_disconnect" \
  --environment "Variables={CONNECTIONS_TABLE=$CONNECTIONS_TABLE}" \
  --query FunctionArn --output text 2>/dev/null \
|| aws lambda update-function-code \
  --profile $PROFILE --region $REGION \
  --function-name "$DISCONNECT_FN" \
  --zip-file "fileb://$zip_disconnect" \
  --query FunctionArn --output text)
echo "  ✓ $DISCONNECT_FN: $DISCONNECT_ARN"

# websocket-broadcast (placeholder — update endpoint after API GW creation)
zip_broadcast=$(create_lambda_zip "websocket-broadcast.mjs")
BROADCAST_ARN=$(aws lambda create-function \
  --profile $PROFILE --region $REGION \
  --function-name "$BROADCAST_FN" \
  --runtime nodejs22.x \
  --role "$LAMBDA_ROLE_ARN" \
  --handler "websocket-broadcast.handler" \
  --zip-file "fileb://$zip_broadcast" \
  --environment "Variables={CONNECTIONS_TABLE=$CONNECTIONS_TABLE,WEBSOCKET_ENDPOINT=PLACEHOLDER}" \
  --query FunctionArn --output text 2>/dev/null \
|| aws lambda update-function-code \
  --profile $PROFILE --region $REGION \
  --function-name "$BROADCAST_FN" \
  --zip-file "fileb://$zip_broadcast" \
  --query FunctionArn --output text)
echo "  ✓ $BROADCAST_FN: $BROADCAST_ARN"

# db-trigger-handler
zip_trigger=$(create_lambda_zip "db-trigger-handler.mjs")
TRIGGER_ARN=$(aws lambda create-function \
  --profile $PROFILE --region $REGION \
  --function-name "$TRIGGER_FN" \
  --runtime nodejs22.x \
  --role "$LAMBDA_ROLE_ARN" \
  --handler "db-trigger-handler.handler" \
  --zip-file "fileb://$zip_trigger" \
  --environment "Variables={BROADCAST_FUNCTION_NAME=$BROADCAST_FN}" \
  --query FunctionArn --output text 2>/dev/null \
|| aws lambda update-function-code \
  --profile $PROFILE --region $REGION \
  --function-name "$TRIGGER_FN" \
  --zip-file "fileb://$zip_trigger" \
  --query FunctionArn --output text)
echo "  ✓ $TRIGGER_FN: $TRIGGER_ARN"

cd - >/dev/null

echo ""
echo "▶ 4/8  Creating API Gateway WebSocket API..."
WS_API_ID=$(aws apigatewayv2 create-api \
  --profile $PROFILE --region $REGION \
  --name "$WS_API_NAME" \
  --protocol-type WEBSOCKET \
  --route-selection-expression '$request.body.action' \
  --query ApiId --output text 2>/dev/null \
|| aws apigatewayv2 get-apis \
  --profile $PROFILE --region $REGION \
  --query "Items[?Name=='$WS_API_NAME'].ApiId" --output text | head -1)

echo "  ✓ API ID: $WS_API_ID"
WS_ENDPOINT="https://${WS_API_ID}.execute-api.${REGION}.amazonaws.com/${STAGE}"
WS_WSS_URL="wss://${WS_API_ID}.execute-api.${REGION}.amazonaws.com/${STAGE}"

echo ""
echo "▶ 5/8  Creating WebSocket routes and integrations..."

# Grant API Gateway permission to invoke Lambda
for FN_ARN in "$CONNECT_ARN" "$DISCONNECT_ARN"; do
  FN_NAME=$(echo $FN_ARN | awk -F: '{print $7}')
  aws lambda add-permission \
    --profile $PROFILE --region $REGION \
    --function-name "$FN_NAME" \
    --statement-id "apigw-ws-invoke-$(date +%s)" \
    --action "lambda:InvokeFunction" \
    --principal "apigateway.amazonaws.com" \
    --source-arn "arn:aws:execute-api:${REGION}:${ACCOUNT_ID}:${WS_API_ID}/*/*" \
    2>/dev/null || true
done

# Create $connect integration
CONNECT_INT=$(aws apigatewayv2 create-integration \
  --profile $PROFILE --region $REGION \
  --api-id "$WS_API_ID" \
  --integration-type AWS_PROXY \
  --integration-uri "arn:aws:apigateway:${REGION}:lambda:path/2015-03-31/functions/${CONNECT_ARN}/invocations" \
  --query IntegrationId --output text)

DISCONNECT_INT=$(aws apigatewayv2 create-integration \
  --profile $PROFILE --region $REGION \
  --api-id "$WS_API_ID" \
  --integration-type AWS_PROXY \
  --integration-uri "arn:aws:apigateway:${REGION}:lambda:path/2015-03-31/functions/${DISCONNECT_ARN}/invocations" \
  --query IntegrationId --output text)

# Create routes
aws apigatewayv2 create-route \
  --profile $PROFILE --region $REGION \
  --api-id "$WS_API_ID" \
  --route-key '$connect' \
  --target "integrations/$CONNECT_INT" >/dev/null

aws apigatewayv2 create-route \
  --profile $PROFILE --region $REGION \
  --api-id "$WS_API_ID" \
  --route-key '$disconnect' \
  --target "integrations/$DISCONNECT_INT" >/dev/null

echo "  ✓ Routes created"

echo ""
echo "▶ 6/8  Deploying API Gateway stage '$STAGE'..."
aws apigatewayv2 create-stage \
  --profile $PROFILE --region $REGION \
  --api-id "$WS_API_ID" \
  --stage-name "$STAGE" \
  --auto-deploy \
  2>/dev/null || true

echo "  ✓ Stage deployed"

echo ""
echo "▶ 7/8  Updating broadcast Lambda with real WebSocket endpoint..."
aws lambda update-function-configuration \
  --profile $PROFILE --region $REGION \
  --function-name "$BROADCAST_FN" \
  --environment "Variables={CONNECTIONS_TABLE=$CONNECTIONS_TABLE,WEBSOCKET_ENDPOINT=$WS_ENDPOINT}" \
  >/dev/null
echo "  ✓ Broadcast endpoint updated: $WS_ENDPOINT"

echo ""
echo "▶ 8/8  Setting up IAM role for RDS to invoke Lambda..."
RDS_TRUST_POLICY='{
  "Version":"2012-10-17",
  "Statement":[{
    "Effect":"Allow",
    "Principal":{"Service":"rds.amazonaws.com"},
    "Action":"sts:AssumeRole"
  }]
}'

RDS_ROLE_ARN=$(aws iam create-role \
  --profile $PROFILE \
  --role-name "$RDS_LAMBDA_ROLE_NAME" \
  --assume-role-policy-document "$RDS_TRUST_POLICY" \
  --query Role.Arn --output text 2>/dev/null \
|| aws iam get-role --profile $PROFILE --role-name "$RDS_LAMBDA_ROLE_NAME" \
   --query Role.Arn --output text)

aws iam put-role-policy --profile $PROFILE \
  --role-name "$RDS_LAMBDA_ROLE_NAME" \
  --policy-name "RDSLambdaInvokePolicy" \
  --policy-document "{
    \"Version\":\"2012-10-17\",
    \"Statement\":[{
      \"Effect\":\"Allow\",
      \"Action\":[\"lambda:InvokeFunction\"],
      \"Resource\":\"$TRIGGER_ARN\"
    }]
  }"

echo "  ✓ RDS Lambda role: $RDS_ROLE_ARN"
echo ""
echo "  ⚠ MANUAL STEP REQUIRED: Associate IAM role with your RDS instance:"
echo "  aws rds add-role-to-db-instance \\"
echo "    --profile $PROFILE --region $REGION \\"
echo "    --db-instance-identifier restaurant \\"
echo "    --role-arn $RDS_ROLE_ARN \\"
echo "    --feature-name Lambda"
echo ""
echo "  Then run infrastructure/sql/triggers.sql replacing LAMBDA_ARN with:"
echo "  $TRIGGER_ARN"

echo ""
echo "============================================================"
echo " ✅ SETUP COMPLETE"
echo "============================================================"
echo ""
echo " WebSocket URL (for .env.local):"
echo " NEXT_PUBLIC_WEBSOCKET_URL=$WS_WSS_URL"
echo ""
echo " Trigger Lambda ARN:"
echo " $TRIGGER_ARN"
echo ""
echo " Next steps:"
echo " 1. Copy NEXT_PUBLIC_WEBSOCKET_URL to .env.local"
echo " 2. Associate RDS IAM role (command above)"
echo " 3. Enable aws_lambda extension on your RDS instance:"
echo "    psql -h restaurant.ckr8w8yqg3ey.us-east-1.rds.amazonaws.com \\"
echo "         -U postgres -d restaurant"
echo "    > CREATE EXTENSION IF NOT EXISTS aws_lambda CASCADE;"
echo " 4. Run triggers.sql with the TRIGGER_ARN above"
echo " 5. npm install && npm run dev"
echo "============================================================"
