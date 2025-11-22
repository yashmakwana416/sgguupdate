-- Drop all existing invoice policies and recreate with strict isolation
DROP POLICY IF EXISTS "Distributors can create own invoices" ON public.sales_invoices;
DROP POLICY IF EXISTS "Distributors can delete own invoices" ON public.sales_invoices;
DROP POLICY IF EXISTS "Distributors can update own invoices" ON public.sales_invoices;
DROP POLICY IF EXISTS "Distributors can view own invoices" ON public.sales_invoices;
DROP POLICY IF EXISTS "Superadmin can create own invoices" ON public.sales_invoices;
DROP POLICY IF EXISTS "Superadmin can update own invoices" ON public.sales_invoices;
DROP POLICY IF EXISTS "Superadmin can delete own invoices" ON public.sales_invoices;
DROP POLICY IF EXISTS "Superadmin can view own invoices" ON public.sales_invoices;
DROP POLICY IF EXISTS "Admin can create invoices" ON public.sales_invoices;
DROP POLICY IF EXISTS "Admin can update all invoices" ON public.sales_invoices;
DROP POLICY IF EXISTS "Admin can delete all invoices" ON public.sales_invoices;
DROP POLICY IF EXISTS "Admin can view all invoices" ON public.sales_invoices;

-- Create strict policies - each user type only sees their own invoices
CREATE POLICY "Distributors can manage own invoices only" 
ON public.sales_invoices 
FOR ALL 
TO authenticated
USING (is_distributor() AND created_by = auth.uid())
WITH CHECK (is_distributor() AND created_by = auth.uid());

CREATE POLICY "Superadmin can manage own invoices only" 
ON public.sales_invoices 
FOR ALL 
TO authenticated
USING (is_superadmin() AND created_by = auth.uid())
WITH CHECK (is_superadmin() AND created_by = auth.uid());

CREATE POLICY "Admin can manage own invoices only" 
ON public.sales_invoices 
FOR ALL 
TO authenticated
USING (is_admin_only() AND created_by = auth.uid())
WITH CHECK (is_admin_only() AND created_by = auth.uid());