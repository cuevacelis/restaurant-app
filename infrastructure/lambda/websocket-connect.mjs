/**
 * Lambda: WebSocket $connect handler
 * Stores connection ID + metadata in DynamoDB
 */
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: "us-east-1" }));
const TABLE_NAME = process.env.CONNECTIONS_TABLE || "RestaurantWebSocketConnections";

export const handler = async (event) => {
  const connectionId = event.requestContext.connectionId;
  const queryParams = event.queryStringParameters || {};

  // role: customer | waiter | chef | admin
  const role = queryParams.role || "customer";
  const tableId = queryParams.tableId || null;
  const userId = queryParams.userId || null;
  const orderId = queryParams.orderId || null;

  // TTL: 24 hours from now
  const ttl = Math.floor(Date.now() / 1000) + 60 * 60 * 24;

  await ddb.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        connectionId,
        role,
        tableId,
        userId,
        orderId,
        connectedAt: new Date().toISOString(),
        ttl,
      },
    })
  );

  return { statusCode: 200, body: "Connected" };
};
