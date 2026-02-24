# Restaurant App - AWS Infrastructure

## Setup Order

1. **Instalar dependencias Lambda** (para el deploy):
   ```bash
   cd infrastructure/lambda
   npm init -y
   npm install @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb \
               @aws-sdk/client-apigatewaymanagementapi \
               @aws-sdk/client-lambda
   ```

2. **Crear todos los recursos AWS**:
   ```bash
   bash infrastructure/setup-aws.sh
   ```

   Esto creará:
   - DynamoDB table: `RestaurantWebSocketConnections`
   - Lambda functions: connect, disconnect, broadcast, db-trigger
   - API Gateway WebSocket API
   - IAM roles y policies

3. **Copiar la URL del WebSocket a `.env.local`**:
   ```
   NEXT_PUBLIC_WEBSOCKET_URL=wss://YOUR_ID.execute-api.us-east-1.amazonaws.com/prod
   ```

4. **Setup de base de datos**:
   ```bash
   # Primero instala dependencias del proyecto
   npm install

   # Luego ejecuta el schema y seed
   node scripts/setup-db.js
   ```

5. **Activar triggers PostgreSQL → Lambda**:
   - Conecta a la DB:
     ```
     psql -h restaurant.ckr8w8yqg3ey.us-east-1.rds.amazonaws.com -U postgres -d restaurant
     ```
   - Habilita la extensión aws_lambda:
     ```sql
     CREATE EXTENSION IF NOT EXISTS aws_lambda CASCADE;
     ```
   - Reemplaza `REPLACE_WITH_YOUR_LAMBDA_ARN` en `triggers.sql` con el ARN de `restaurant-db-trigger`
   - Ejecuta `infrastructure/sql/triggers.sql`

6. **Asociar rol IAM con RDS** (command from setup-aws.sh output):
   ```bash
   aws rds add-role-to-db-instance \
     --profile default --region us-east-1 \
     --db-instance-identifier restaurant \
     --role-arn arn:aws:iam::ACCOUNT_ID:role/restaurant-rds-lambda-role \
     --feature-name Lambda
   ```

## WebSocket Message Flow

```
Client places order
    ↓
Next.js API → PostgreSQL INSERT
    ↓
PostgreSQL trigger fires
    ↓
aws_lambda.invoke() → Lambda: restaurant-db-trigger
    ↓
Lambda invokes → Lambda: restaurant-ws-broadcast
    ↓
Broadcast scans DynamoDB connections
    ↓
Sends WS message to relevant connections (role-based)
    ↓
Next.js clients receive message → UI updates
```

## Roles and Notifications

| Status Change | Who gets notified |
|---|---|
| `pending` (new order) | Chef + Admin |
| `in_preparation` | Customer (same table) + Admin |
| `ready_to_deliver` | All Waiters + Admin |
| `completed` | Customer (same table) + Admin |

## QR Code URLs

Each table gets a URL: `https://your-domain.com/mesa/[table_number]`

The QR code should encode this URL. Customers scan it and are taken directly to the ordering page.
