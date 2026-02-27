-- ============================================================
-- WEBSOCKET TRIGGERS via aws_lambda extension
-- Run AFTER schema.sql AND AFTER Lambda functions are deployed
--
-- Usage:
--   pnpm db:triggers   (reads .env.local automatically)
-- ============================================================

-- Validate that lambda_arn was passed
\if :{?lambda_arn}
\else
  \warn 'ERROR: variable lambda_arn no definida. Usa: pnpm db:triggers'
  \quit
\endif

-- psql variable substitution works in regular SQL (outside $$ blocks).
-- We use format() + \gexec to embed the ARN as a constant directly in
-- the function body — no runtime config lookups, no permission issues on RDS.
SELECT format(
  $tpl$
    CREATE OR REPLACE FUNCTION notify_order_change()
    RETURNS TRIGGER AS $fn$
    DECLARE
      payload       JSON;
      lambda_arn    CONSTANT TEXT := %L;
      lambda_region CONSTANT TEXT := %L;
    BEGIN
      payload := json_build_object(
        'event',         TG_OP,
        'order_id',      NEW.id,
        'table_id',      NEW.table_id,
        'customer_name', NEW.customer_name,
        'order_type',    NEW.order_type,
        'status',        NEW.status,
        'total_amount',  NEW.total_amount,
        'updated_at',    NEW.updated_at
      );

      PERFORM aws_lambda.invoke(
        aws_commons.create_lambda_function_arn(lambda_arn, lambda_region),
        payload,
        'Event'
      );

      RETURN NEW;
    EXCEPTION
      -- Never block DB operations if Lambda call fails
      WHEN OTHERS THEN
        RAISE WARNING 'Lambda invoke failed: %%', SQLERRM;
        RETURN NEW;
    END;
    $fn$ LANGUAGE plpgsql SECURITY DEFINER
  $tpl$,
  :'lambda_arn',
  split_part(:'lambda_arn', ':', 4)
);
\gexec

-- Attach trigger to orders table
DROP TRIGGER IF EXISTS orders_notify_change ON orders;
CREATE TRIGGER orders_notify_change
  AFTER INSERT OR UPDATE OF status ON orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_order_change();
