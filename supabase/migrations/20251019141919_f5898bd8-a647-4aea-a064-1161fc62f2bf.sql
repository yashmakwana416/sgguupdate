-- Fix database functions that reference invalid 'admin' enum value
-- The app_role enum only has 'superadmin' and 'distributor', not 'admin'

-- Update is_admin() to check for superadmin instead
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$ 
  SELECT public.has_role(auth.uid(), 'superadmin'::public.app_role)
$function$;

-- Update is_admin_only() to return false since we don't have separate admin role
CREATE OR REPLACE FUNCTION public.is_admin_only()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT false
$function$;

-- Update is_admin_or_superadmin() to check only superadmin
CREATE OR REPLACE FUNCTION public.is_admin_or_superadmin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT public.is_superadmin()
$function$;