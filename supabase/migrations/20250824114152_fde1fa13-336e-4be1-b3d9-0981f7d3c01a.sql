-- Drop child first (idempotent)
DROP TABLE IF EXISTS public.sales_invoice_items CASCADE;

-- Drop parent next (idempotent)
DROP TABLE IF EXISTS public.sales_invoices CASCADE;

-- Optionally drop the trigger function only if it exists and has no dependent triggers
DO $$
BEGIN
  -- Check if function exists
  IF EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'update_updated_at_column'
      AND p.pronargs = 0
  ) THEN
    -- Only drop if no triggers depend on it
    IF NOT EXISTS (
      SELECT 1
      FROM pg_trigger t
      JOIN pg_proc p ON t.tgfoid = p.oid
      JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'public'
        AND p.proname = 'update_updated_at_column'
        AND p.pronargs = 0
        AND NOT t.tgisinternal
    ) THEN
      EXECUTE 'DROP FUNCTION public.update_updated_at_column()';
    END IF;
  END IF;
END
$$;

-- Verification queries (safe no-ops in migration context)
-- Expect both to be NULL after successful drops
SELECT
  to_regclass('public.sales_invoice_items') AS sales_invoice_items,
  to_regclass('public.sales_invoices')     AS sales_invoices;

-- Function presence check (true means it still exists)
SELECT EXISTS (
  SELECT 1
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.proname = 'update_updated_at_column'
    AND p.pronargs = 0
) AS update_updated_at_column_exists;