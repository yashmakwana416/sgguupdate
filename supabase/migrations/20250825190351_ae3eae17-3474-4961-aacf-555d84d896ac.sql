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
$function$

-- Create a trigger function to check overdue status on invoice updates
CREATE OR REPLACE FUNCTION public.check_overdue_status()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  -- If due date has passed and status is not paid, mark as overdue
  IF NEW.due_date IS NOT NULL 
     AND NEW.due_date < CURRENT_DATE 
     AND NEW.status != 'paid' 
     AND NEW.status != 'overdue' THEN
    NEW.status = 'overdue';
  END IF;
  
  RETURN NEW;
END;
$function$

-- Create trigger to automatically check overdue status on insert/update
DROP TRIGGER IF EXISTS trigger_check_overdue_status ON public.sales_invoices;
CREATE TRIGGER trigger_check_overdue_status
  BEFORE INSERT OR UPDATE ON public.sales_invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.check_overdue_status();