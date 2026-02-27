/**
 * Lambda: Broadcasts order updates to connected WebSocket clients
 * Called by db-trigger-handler on every INSERT/UPDATE to orders table
 */
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { ApiGatewayManagementApiClient, PostToConnectionCommand } from "@aws-sdk/client-apigatewaymanagementapi";

const ddb = DynamoDBDocumentClient.from(
  new DynamoDBClient({ region: process.env.AWS_REGION || "us-east-1" })
);
const TABLE_NAME   = process.env.CONNECTIONS_TABLE || "RestaurantWebSocketConnections";
const WS_ENDPOINT  = process.env.WEBSOCKET_ENDPOINT;

const apiGw = new ApiGatewayManagementApiClient({ endpoint: WS_ENDPOINT });

export const handler = async (event) => {
  const message = typeof event === "string" ? JSON.parse(event) : event;
  const { status, table_id } = message;

  const { Items: connections = [] } = await ddb.send(
    new ScanCommand({ TableName: TABLE_NAME })
  );

  const targets = connections.filter((conn) => shouldNotify(conn, { status, table_id }));

  await Promise.all(
    targets.map((conn) => sendMessage(conn.connectionId, message))
  );

  return { statusCode: 200 };
};

async function sendMessage(connectionId, message) {
  try {
    await apiGw.send(
      new PostToConnectionCommand({
        ConnectionId: connectionId,
        Data: Buffer.from(JSON.stringify({ type: "ORDER_UPDATE", data: message })),
      })
    );
  } catch (err) {
    // GoneException (410) = browser disconnected without $disconnect firing — clean up
    if (err.name === "GoneException" || err.$metadata?.httpStatusCode === 410) {
      await ddb.send(
        new DeleteCommand({ TableName: TABLE_NAME, Key: { connectionId } })
      );
      return;
    }
    console.error(`PostToConnection failed for ${connectionId}:`, err.message);
  }
}

/**
 * Who gets notified based on order status:
 *
 * pending          → chefs + admin        (new order arrived)
 * in_preparation   → customer + admin     (chef started cooking)
 * ready_to_deliver → waiters + admin      (order ready to serve)
 * completed        → customer + admin     (order delivered)
 * cancelled        → chefs + waiters + admin
 */
function shouldNotify(conn, { status, table_id }) {
  const { role, tableId } = conn;

  if (role === "admin") return true;

  switch (status) {
    case "pending":
      return role === "chef";

    case "in_preparation":
      return role === "customer" && tableId === table_id;

    case "ready_to_deliver":
      return role === "waiter";

    case "completed":
      return role === "customer" && tableId === table_id;

    case "cancelled":
      return role === "chef" || role === "waiter";

    default:
      return false;
  }
}
