-- Drop existing problematic policies on user_roles that cause infinite recursion
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view roles" ON public.user_roles;
DROP POLICY IF EXISTS "admin_can_manage_roles" ON public.user_roles;
DROP POLICY IF EXISTS "superadmin_full_access" ON public.user_roles;
DROP POLICY IF EXISTS "users_can_view_own_role" ON public.user_roles;

-- Create new policies using security definer functions to avoid recursion
CREATE POLICY "superadmin_full_access" ON public.user_roles
FOR ALL 
USING (is_superadmin())
WITH CHECK (is_superadmin());

CREATE POLICY "admin_can_manage_distributor_viewer_roles" ON public.user_roles
FOR ALL 
USING (is_admin() AND role IN ('distributor', 'viewer'))
WITH CHECK (is_admin() AND role IN ('distributor', 'viewer'));

CREATE POLICY "users_can_view_own_role" ON public.user_roles
FOR SELECT 
USING (user_id = auth.uid());

-- Ensure superadmin user exists in profiles
INSERT INTO public.profiles (id, email, first_name, last_name)
VALUES (
  '356bd88a-2576-4a17-a433-409735573a88',
  'smitmodi416@gmail.com',
  'Super',
  'Admin'
)
ON CONFLICT (id) DO UPDATE 
SET email = EXCLUDED.email,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    updated_at = now();

-- Ensure superadmin role exists in user_roles
INSERT INTO public.user_roles (user_id, role)
VALUES (
  '356bd88a-2576-4a17-a433-409735573a88',
  'admin'
)
ON CONFLICT (user_id, role) DO NOTHING;