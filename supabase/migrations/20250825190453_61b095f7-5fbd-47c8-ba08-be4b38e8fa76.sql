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
$function$;