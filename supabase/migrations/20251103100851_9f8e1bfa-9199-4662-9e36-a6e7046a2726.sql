-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Authenticated users can view active products" ON public.products;

-- Allow everyone to view active products
CREATE POLICY "Anyone can view active products"
ON public.products
FOR SELECT
USING (is_active = true);

-- Allow admins and superadmins to insert products
CREATE POLICY "Admins can insert products"
ON public.products
FOR INSERT
WITH CHECK (is_superadmin() OR is_admin());

-- Allow admins and superadmins to update products
CREATE POLICY "Admins can update products"
ON public.products
FOR UPDATE
USING (is_superadmin() OR is_admin())
WITH CHECK (is_superadmin() OR is_admin());

-- Allow admins and superadmins to delete products
CREATE POLICY "Admins can delete products"
ON public.products
FOR DELETE
USING (is_superadmin() OR is_admin());