-- Let's fix the distributor product visibility issue by updating the RLS policy
-- First, let's drop the existing policy and recreate it with better logic

DROP POLICY IF EXISTS "Distributors can view admin products" ON public.products;

-- Create a more straightforward policy for distributors to view admin products
CREATE POLICY "Distributors can view admin products" 
ON public.products 
FOR SELECT 
USING (
  is_distributor() 
  AND is_active = true 
  AND (
    -- Check if product was created by an admin or superadmin
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = products.created_by 
      AND ur.role IN ('admin', 'superadmin')
    )
    OR 
    -- Also allow products created by the superadmin email directly
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = products.created_by 
      AND p.email = 'smitmodi416@gmail.com'
    )
  )
);