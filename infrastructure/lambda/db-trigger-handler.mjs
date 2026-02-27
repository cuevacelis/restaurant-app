/**
 * Lambda: Called directly by PostgreSQL trigger via aws_lambda extension
 * Acts as a bridge: receives the order change payload and forwards it
 * to ws-broadcast asynchronously, keeping the DB transaction non-blocking.
 */
import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";

const lambda = new LambdaClient({ region: process.env.AWS_REGION || "us-east-1" });
const BROADCAST_FUNCTION = process.env.BROADCAST_FUNCTION_NAME || "restaurant-ws-broadcast";

export const handler = async (event) => {
  const payload = typeof event === "string" ? JSON.parse(event) : event;

  try {
    await lambda.send(
      new InvokeCommand({
        FunctionName: BROADCAST_FUNCTION,
        InvocationType: "Event", // async — no espera respuesta del broadcast
        Payload: Buffer.from(JSON.stringify(payload)),
      })
    );
  } catch (err) {
    console.error("Failed to invoke broadcast Lambda:", err.message);
  }

  return { statusCode: 200 };
};
