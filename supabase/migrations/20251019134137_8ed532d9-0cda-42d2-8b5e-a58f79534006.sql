-- Remove superadmin role from smxth, keep only admin
DELETE FROM public.user_roles 
WHERE user_id = '6f0d2e00-8e2f-48fc-99b2-c7d167ac6649' AND role = 'superadmin';

-- Ensure smxth has admin role
INSERT INTO public.user_roles (user_id, role)
VALUES ('6f0d2e00-8e2f-48fc-99b2-c7d167ac6649', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- Ensure smitmodi416 is in user_roles as superadmin (the real superadmin)
INSERT INTO public.user_roles (user_id, role)
VALUES ('356bd88a-2576-4a17-a433-409735573a88', 'superadmin')
ON CONFLICT (user_id, role) DO NOTHING;

-- Drop existing policies
DROP POLICY IF EXISTS "superadmin_full_access" ON public.user_roles;
DROP POLICY IF EXISTS "users_can_view_own_role" ON public.user_roles;

-- Create new policies: superadmin (smitmodi416@gmail.com) has full access
CREATE POLICY "superadmin_full_access" ON public.user_roles
FOR ALL
USING (
  auth.uid() = '356bd88a-2576-4a17-a433-409735573a88'::uuid
)
WITH CHECK (
  auth.uid() = '356bd88a-2576-4a17-a433-409735573a88'::uuid
);

-- All authenticated users can view their own role
CREATE POLICY "users_can_view_own_role" ON public.user_roles
FOR SELECT
USING (user_id = auth.uid());