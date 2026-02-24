/**
 * Lambda: WebSocket $disconnect handler
 * Removes connection ID from DynamoDB
 */
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, DeleteCommand } from "@aws-sdk/lib-dynamodb";

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: "us-east-1" }));
const TABLE_NAME = process.env.CONNECTIONS_TABLE || "RestaurantWebSocketConnections";

export const handler = async (event) => {
  const connectionId = event.requestContext.connectionId;

  await ddb.send(
    new DeleteCommand({
      TableName: TABLE_NAME,
      Key: { connectionId },
    })
  );

  return { statusCode: 200, body: "Disconnected" };
};
