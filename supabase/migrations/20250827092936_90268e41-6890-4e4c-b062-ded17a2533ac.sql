-- Create a sequence for race-proof invoice numbering
CREATE SEQUENCE IF NOT EXISTS public.sales_invoice_number_seq;

-- Initialize the sequence to current max invoice numeric suffix
SELECT setval('public.sales_invoice_number_seq',
  COALESCE((
    SELECT MAX(CAST(SUBSTRING(invoice_number FROM 'INV-(\\d+)') AS INTEGER))
    FROM public.sales_invoices
    WHERE invoice_number ~ '^INV-\\d+$'
  ), 0)
);

-- Update function to use the sequence and 5-digit padding
CREATE OR REPLACE FUNCTION public.generate_sales_invoice_number()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
    NEW.invoice_number := 'INV-' || LPAD(nextval('public.sales_invoice_number_seq')::TEXT, 5, '0');
  END IF;
  RETURN NEW;
END;
$function$;

-- Ensure trigger exists to set invoice number before insert
DROP TRIGGER IF EXISTS set_sales_invoice_number ON public.sales_invoices;

CREATE TRIGGER set_sales_invoice_number
BEFORE INSERT ON public.sales_invoices
FOR EACH ROW
EXECUTE FUNCTION public.generate_sales_invoice_number();

-- Add a unique constraint on invoice_number if there are no duplicates
DO $$
DECLARE has_dupes boolean;
BEGIN
  SELECT EXISTS(
    SELECT invoice_number FROM public.sales_invoices
    GROUP BY invoice_number HAVING COUNT(*) > 1
  ) INTO has_dupes;

  IF NOT has_dupes THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conrelid = 'public.sales_invoices'::regclass
        AND conname = 'sales_invoices_invoice_number_key'
    ) THEN
      ALTER TABLE public.sales_invoices
      ADD CONSTRAINT sales_invoices_invoice_number_key UNIQUE (invoice_number);
    END IF;
  END IF;
END $$;