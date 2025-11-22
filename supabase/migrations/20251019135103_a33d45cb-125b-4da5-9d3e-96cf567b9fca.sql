-- Drop and recreate functions with CASCADE to handle dependencies
DROP FUNCTION IF EXISTS public.has_role(uuid, app_role) CASCADE;
DROP FUNCTION IF EXISTS public.is_distributor() CASCADE;
DROP FUNCTION IF EXISTS public.is_admin_or_superadmin() CASCADE;

-- Recreate has_role function
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Recreate is_distributor function
CREATE OR REPLACE FUNCTION public.is_distributor()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$ 
  SELECT public.has_role(auth.uid(), 'distributor'::public.app_role) 
$$;

-- Recreate is_admin_or_superadmin function  
CREATE OR REPLACE FUNCTION public.is_admin_or_superadmin()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN is_superadmin();
END;
$$;