-- Create function to update overdue invoices
CREATE OR REPLACE FUNCTION public.update_overdue_invoices()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Update invoices to overdue status if due date has passed and status is not paid
  UPDATE public.sales_invoices 
  SET status = 'overdue', updated_at = now()
  WHERE due_date < CURRENT_DATE 
    AND status != 'paid' 
    AND status != 'overdue';
END;
$function$;