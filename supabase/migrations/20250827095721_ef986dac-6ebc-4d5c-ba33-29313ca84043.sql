-- Create a function to check if user is admin only (not superadmin)
CREATE OR REPLACE FUNCTION public.is_admin_only()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Return true only if user is admin but NOT superadmin
  RETURN is_admin() AND NOT is_superadmin();
END;
$function$;