/**
 * Lambda: Called directly by PostgreSQL trigger via aws_lambda extension
 * Receives order change data and calls the broadcast Lambda
 */
import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";

const lambda = new LambdaClient({ region: "us-east-1" });
const BROADCAST_FUNCTION = process.env.BROADCAST_FUNCTION_NAME || "restaurant-ws-broadcast";

export const handler = async (event) => {
  console.log("DB trigger received:", JSON.stringify(event));

  // PostgreSQL sends the payload as the event body
  // It may come directly as the object or as a JSON string
  const payload = typeof event === "string" ? JSON.parse(event) : event;

  // Invoke broadcast Lambda asynchronously
  await lambda.send(
    new InvokeCommand({
      FunctionName: BROADCAST_FUNCTION,
      InvocationType: "Event", // async
      Payload: Buffer.from(JSON.stringify(payload)),
    })
  );

  return { statusCode: 200 };
};
