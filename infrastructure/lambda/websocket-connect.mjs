/**
 * Lambda: WebSocket $connect handler
 * Stores connection ID + metadata in DynamoDB
 */
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

const ddb = DynamoDBDocumentClient.from(
  new DynamoDBClient({ region: process.env.AWS_REGION || "us-east-1" })
);
const TABLE_NAME = process.env.CONNECTIONS_TABLE || "RestaurantWebSocketConnections";

const VALID_ROLES = new Set(["customer", "waiter", "chef", "admin"]);

export const handler = async (event) => {
  const connectionId = event.requestContext.connectionId;
  const queryParams = event.queryStringParameters || {};

  const role = VALID_ROLES.has(queryParams.role) ? queryParams.role : "customer";
  const tableId = queryParams.tableId || null;
  const userId  = queryParams.userId  || null;
  const orderId = queryParams.orderId || null;

  // TTL: 24 hours from now
  const ttl = Math.floor(Date.now() / 1000) + 60 * 60 * 24;

  try {
    await ddb.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: { connectionId, role, tableId, userId, orderId, ttl },
      })
    );
  } catch (err) {
    // Log but always return 200 — a non-200 response causes API GW to reject the connection
    console.error("DynamoDB PutCommand failed:", err.message);
  }

  return { statusCode: 200, body: "Connected" };
};
