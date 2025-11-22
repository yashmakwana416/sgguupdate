-- Create sequence for race-proof invoice numbering (if not exists)
CREATE SEQUENCE IF NOT EXISTS public.sales_invoice_number_seq START 1;

-- Initialize sequence to the highest existing invoice number + 1
DO $$
DECLARE
  max_invoice_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 'INV-(\\d+)') AS INTEGER)), 0)
  INTO max_invoice_num
  FROM public.sales_invoices
  WHERE invoice_number ~ '^INV-\\d+$';
  
  -- Set sequence to next number (at least 1)
  PERFORM setval('public.sales_invoice_number_seq', GREATEST(max_invoice_num + 1, 1));
END $$;

-- Update function to use sequence with 5-digit padding
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

-- Create trigger (if not exists)
DROP TRIGGER IF EXISTS set_sales_invoice_number ON public.sales_invoices;
CREATE TRIGGER set_sales_invoice_number
  BEFORE INSERT ON public.sales_invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_sales_invoice_number();