-- Fix user_roles policies to avoid referencing auth.users directly (causing 403)
DROP POLICY IF EXISTS "superadmin_full_access" ON public.user_roles;
DROP POLICY IF EXISTS "admin_can_manage_distributor_viewer_roles" ON public.user_roles;
DROP POLICY IF EXISTS "users_can_view_own_role" ON public.user_roles;

-- Allow superadmin full access using security definer function (safe, no recursion)
CREATE POLICY "superadmin_full_access" ON public.user_roles
FOR ALL
USING (is_superadmin())
WITH CHECK (is_superadmin());

-- Allow users to read their own roles
CREATE POLICY "users_can_view_own_role" ON public.user_roles
FOR SELECT
USING (user_id = auth.uid());

-- Ensure smxth is superadmin (remove other roles for a single-source-of-truth)
DELETE FROM public.user_roles
WHERE user_id = '6f0d2e00-8e2f-48fc-99b2-c7d167ac6649' AND role <> 'superadmin';

INSERT INTO public.user_roles (user_id, role)
VALUES ('6f0d2e00-8e2f-48fc-99b2-c7d167ac6649', 'superadmin')
ON CONFLICT (user_id, role) DO NOTHING;