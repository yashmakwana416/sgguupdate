-- Fix product policies for distributors
-- Drop existing distributor policies that allow them to create/modify products
DROP POLICY IF EXISTS "Distributors can create own products" ON public.products;
DROP POLICY IF EXISTS "Distributors can delete own products" ON public.products;
DROP POLICY IF EXISTS "Distributors can update own products" ON public.products;
DROP POLICY IF EXISTS "Distributors can view own products" ON public.products;

-- Create new policy: Distributors can only VIEW products created by admins/superadmins
CREATE POLICY "Distributors can view admin products" 
ON public.products 
FOR SELECT 
TO authenticated
USING (
  is_distributor() AND 
  is_active = true AND 
  (
    -- Allow viewing products created by users with admin or superadmin roles
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = products.created_by 
      AND ur.role IN ('admin', 'superadmin')
    )
    OR
    -- Also allow viewing products created by superadmin function check
    (
      SELECT email FROM public.profiles WHERE id = products.created_by
    ) = 'smitmodi416@gmail.com'
  )
);

-- Enable real-time for products table
ALTER TABLE public.products REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.products;