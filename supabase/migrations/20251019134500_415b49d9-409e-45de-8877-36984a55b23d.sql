-- Remove all roles except superadmin and distributor
DELETE FROM public.user_roles 
WHERE role NOT IN ('superadmin', 'distributor');

-- Update the app_role enum to only have superadmin and distributor
-- First, we need to remove the old enum and create a new one
ALTER TABLE public.user_roles 
ALTER COLUMN role TYPE text;

DROP TYPE IF EXISTS public.app_role CASCADE;

CREATE TYPE public.app_role AS ENUM ('superadmin', 'distributor');

ALTER TABLE public.user_roles 
ALTER COLUMN role TYPE public.app_role USING role::public.app_role;

-- Recreate policies with the new enum
DROP POLICY IF EXISTS "superadmin_full_access" ON public.user_roles;
DROP POLICY IF EXISTS "users_can_view_own_role" ON public.user_roles;

-- Only superadmin can manage all roles
CREATE POLICY "superadmin_full_access" ON public.user_roles
FOR ALL
USING (
  auth.uid() = '356bd88a-2576-4a17-a433-409735573a88'::uuid
)
WITH CHECK (
  auth.uid() = '356bd88a-2576-4a17-a433-409735573a88'::uuid
);

-- All users can view their own role
CREATE POLICY "users_can_view_own_role" ON public.user_roles
FOR SELECT
USING (user_id = auth.uid());