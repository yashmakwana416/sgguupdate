-- Harden function search_path for safety
CREATE OR REPLACE FUNCTION public.generate_sales_invoice_number()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
    NEW.invoice_number := 'INV-' || LPAD(nextval('public.sales_invoice_number_seq')::TEXT, 5, '0');
  END IF;
  RETURN NEW;
END;
$function$;