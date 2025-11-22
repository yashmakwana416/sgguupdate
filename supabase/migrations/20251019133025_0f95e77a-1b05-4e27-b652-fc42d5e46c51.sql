-- Drop all policies on user_roles that cause infinite recursion
DROP POLICY IF EXISTS "superadmin_full_access" ON public.user_roles;
DROP POLICY IF EXISTS "admin_can_manage_distributor_viewer_roles" ON public.user_roles;
DROP POLICY IF EXISTS "users_can_view_own_role" ON public.user_roles;

-- Create policies that DON'T query user_roles (no recursion)
-- Superadmin has full access (check email directly from auth.users)
CREATE POLICY "superadmin_full_access" ON public.user_roles
FOR ALL 
USING (
  (SELECT email FROM auth.users WHERE id = auth.uid()) = 'smitmodi416@gmail.com'
)
WITH CHECK (
  (SELECT email FROM auth.users WHERE id = auth.uid()) = 'smitmodi416@gmail.com'
);

-- All authenticated users can view their own role
CREATE POLICY "users_can_view_own_role" ON public.user_roles
FOR SELECT 
USING (user_id = auth.uid());

-- Ensure superadmin user exists in auth.users
DO $$
DECLARE
  superadmin_id uuid := '356bd88a-2576-4a17-a433-409735573a88';
  user_exists boolean;
BEGIN
  -- Check if user exists in auth.users
  SELECT EXISTS(SELECT 1 FROM auth.users WHERE id = superadmin_id) INTO user_exists;
  
  IF NOT user_exists THEN
    -- Insert into auth.users if doesn't exist
    INSERT INTO auth.users (
      id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      role
    ) VALUES (
      superadmin_id,
      'smitmodi416@gmail.com',
      crypt('111111', gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"first_name":"Super","last_name":"Admin"}'::jsonb,
      false,
      'authenticated'
    );
  END IF;
END $$;

-- Ensure superadmin profile exists
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

-- Ensure superadmin has admin role
INSERT INTO public.user_roles (user_id, role)
VALUES (
  '356bd88a-2576-4a17-a433-409735573a88',
  'admin'
)
ON CONFLICT (user_id, role) DO NOTHING;