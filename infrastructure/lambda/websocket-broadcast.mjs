/**
 * Lambda: Called by db-trigger-handler to broadcast messages
 * to connected WebSocket clients based on role/tableId
 */
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { ApiGatewayManagementApiClient, PostToConnectionCommand } from "@aws-sdk/client-apigatewaymanagementapi";

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: "us-east-1" }));
const TABLE_NAME = process.env.CONNECTIONS_TABLE || "RestaurantWebSocketConnections";
const WS_ENDPOINT = process.env.WEBSOCKET_ENDPOINT; // e.g. https://xxx.execute-api.us-east-1.amazonaws.com/prod

export const handler = async (event) => {
  const message = typeof event === "string" ? JSON.parse(event) : event;

  /*
   * message shape from DB trigger:
   * {
   *   event: "INSERT" | "UPDATE",
   *   order_id, table_id, customer_name,
   *   order_type, status, total_amount, updated_at
   * }
   */

  // Determine which connections to notify based on new status
  const { status, table_id, order_id } = message;

  // Fetch all active connections
  const scan = await ddb.send(new ScanCommand({ TableName: TABLE_NAME }));
  const connections = scan.Items || [];

  const apiGw = new ApiGatewayManagementApiClient({ endpoint: WS_ENDPOINT });

  const notifyPromises = connections
    .filter((conn) => shouldNotify(conn, { status, table_id, order_id }))
    .map(async (conn) => {
      try {
        await apiGw.send(
          new PostToConnectionCommand({
            ConnectionId: conn.connectionId,
            Data: Buffer.from(JSON.stringify({ type: "ORDER_UPDATE", data: message })),
          })
        );
      } catch (err) {
        // Connection is stale — remove it
        if (err.statusCode === 410) {
          await ddb.send(
            new DeleteCommand({
              TableName: TABLE_NAME,
              Key: { connectionId: conn.connectionId },
            })
          );
        }
      }
    });

  await Promise.all(notifyPromises);
  return { statusCode: 200 };
};

/**
 * Determine if a WebSocket connection should receive a notification
 * based on order status change:
 *
 * - pending → chefs + admin
 * - in_preparation → customer (that table) + admin
 * - ready_to_deliver → waiters + admin
 * - completed → customer (that table) + admin
 */
function shouldNotify(conn, { status, table_id }) {
  const role = conn.role;

  if (role === "admin") return true;

  switch (status) {
    case "pending":
      // New order → notify chef
      return role === "chef";

    case "in_preparation":
      // Chef started → notify customer of that table
      return role === "customer" && conn.tableId === table_id;

    case "ready_to_deliver":
      // Order ready → notify all waiters
      return role === "waiter";

    case "completed":
      // Completed → notify customer of that table
      return role === "customer" && conn.tableId === table_id;

    default:
      return false;
  }
}
