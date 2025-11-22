-- Let's debug the RLS issue by creating a more robust policy
-- First, let's see what the current policy looks like and recreate it with better logic

DROP POLICY IF EXISTS "Distributors can view admin products" ON public.products;

-- Create a comprehensive policy that allows distributors to see products created by admins
CREATE POLICY "Distributors can view admin products" 
ON public.products 
FOR SELECT 
USING (
  is_distributor() 
  AND is_active = true 
  AND (
    -- Product created by someone with admin role
    created_by IN (
      SELECT user_id FROM public.user_roles 
      WHERE role IN ('admin', 'superadmin')
    )
    OR 
    -- Product created by superadmin email directly
    created_by IN (
      SELECT id FROM public.profiles 
      WHERE email = 'smitmodi416@gmail.com'
    )
  )
);

-- Also ensure the existing superadmin/admin policy still works
DROP POLICY IF EXISTS "Superadmin and admin can view all products" ON public.products;

CREATE POLICY "Superadmin and admin can view all products" 
ON public.products 
FOR SELECT 
USING (
  (is_admin_or_superadmin() AND is_active = true)
);