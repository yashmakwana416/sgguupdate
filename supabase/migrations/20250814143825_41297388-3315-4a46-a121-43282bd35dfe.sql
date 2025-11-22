-- Fix the ambiguous column reference in generate_salesperson_invoice_number function
CREATE OR REPLACE FUNCTION public.generate_salesperson_invoice_number()
 RETURNS text
 LANGUAGE plpgsql
AS $function$
DECLARE
  next_number INTEGER;
  new_invoice_number TEXT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(salesperson_invoices.invoice_number FROM 'SP-(\d+)') AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.salesperson_invoices
  WHERE salesperson_invoices.invoice_number ~ '^SP-\d+$';
  
  new_invoice_number := 'SP-' || LPAD(next_number::TEXT, 6, '0');
  RETURN new_invoice_number;
END;
$function$;