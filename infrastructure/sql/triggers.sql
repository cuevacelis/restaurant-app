-- ============================================================
-- WEBSOCKET TRIGGERS via aws_lambda extension
-- Run AFTER schema.sql y AFTER Lambda functions are deployed
--
-- Requiere pasar el ARN como variable de psql:
--   psql -h HOST -U USER -d DB -v lambda_arn='arn:aws:...' -f triggers.sql
--
-- El ARN lo imprime setup-aws.sh al final.
-- ============================================================

-- Validar que la variable lambda_arn fue pasada
\if :{?lambda_arn}
\else
  \warn 'ERROR: variable lambda_arn no definida.'
  \warn 'Ejecuta con: psql ... -v lambda_arn=''arn:aws:lambda:REGION:ACCOUNT:function:NOMBRE'''
  \quit
\endif

-- Function called on orders INSERT/UPDATE → invokes Lambda → API Gateway WebSocket
CREATE OR REPLACE FUNCTION notify_order_change()
RETURNS TRIGGER AS $$
DECLARE
  payload        JSON;
  lambda_arn     TEXT := :'lambda_arn';
  lambda_region  TEXT := 'us-east-1';
BEGIN
  -- Build JSON payload
  payload := json_build_object(
    'event',        TG_OP,
    'order_id',     NEW.id,
    'table_id',     NEW.table_id,
    'customer_name',NEW.customer_name,
    'order_type',   NEW.order_type,
    'status',       NEW.status,
    'total_amount', NEW.total_amount,
    'updated_at',   NEW.updated_at
  );

  -- Invoke Lambda asynchronously (non-blocking for DB performance)
  PERFORM aws_lambda.invoke(
    aws_commons.create_lambda_function_arn(lambda_arn, lambda_region),
    payload,
    'Event'  -- InvocationType: Event = async, RequestResponse = sync
  );

  RETURN NEW;
EXCEPTION
  -- Never block DB operations if Lambda call fails
  WHEN OTHERS THEN
    RAISE WARNING 'Lambda invoke failed: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger to orders table
DROP TRIGGER IF EXISTS orders_notify_change ON orders;
CREATE TRIGGER orders_notify_change
  AFTER INSERT OR UPDATE OF status ON orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_order_change();

-- ============================================================
-- Grant Lambda invocation permissions (set after deploying IAM)
-- ============================================================
-- ALTER ROLE postgres SET pgsession.aws_lambda_role = 'arn:aws:iam::ACCOUNT_ID:role/rds-lambda-role';
