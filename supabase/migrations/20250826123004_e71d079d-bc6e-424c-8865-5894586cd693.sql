-- Clean up all existing policies and create fresh ones
DROP POLICY IF EXISTS "Superadmin and admin can create products" ON public.products;
DROP POLICY IF EXISTS "Superadmin and admin can delete all products" ON public.products;
DROP POLICY IF EXISTS "Superadmin and admin can update all products" ON public.products;
DROP POLICY IF EXISTS "Admins can manage products" ON public.products;
DROP POLICY IF EXISTS "Users can view active products" ON public.products;

-- Create a simple, clear policy for viewing active products
CREATE POLICY "Authenticated users can view active products" 
ON public.products 
FOR SELECT 
TO authenticated 
USING (is_active = true);

-- Create management policy for admins only
CREATE POLICY "Admin and superadmin full access" 
ON public.products 
FOR ALL 
TO authenticated 
USING (is_admin_or_superadmin()) 
WITH CHECK (is_admin_or_superadmin());