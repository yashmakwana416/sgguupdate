-- Update RLS policies so superadmin only sees their own invoices, not all invoices

-- Drop existing policies for sales_invoices
DROP POLICY IF EXISTS "Superadmin and admin can create invoices" ON public.sales_invoices;
DROP POLICY IF EXISTS "Superadmin and admin can delete all invoices" ON public.sales_invoices;
DROP POLICY IF EXISTS "Superadmin and admin can update all invoices" ON public.sales_invoices;
DROP POLICY IF EXISTS "Superadmin and admin can view all invoices" ON public.sales_invoices;

-- Create new policies for superadmin to only manage their own invoices
CREATE POLICY "Superadmin can create own invoices" 
ON public.sales_invoices 
FOR INSERT 
TO authenticated
WITH CHECK (is_superadmin() AND created_by = auth.uid());

CREATE POLICY "Superadmin can update own invoices" 
ON public.sales_invoices 
FOR UPDATE 
TO authenticated
USING (is_superadmin() AND created_by = auth.uid())
WITH CHECK (is_superadmin() AND created_by = auth.uid());

CREATE POLICY "Superadmin can delete own invoices" 
ON public.sales_invoices 
FOR DELETE 
TO authenticated
USING (is_superadmin() AND created_by = auth.uid());

CREATE POLICY "Superadmin can view own invoices" 
ON public.sales_invoices 
FOR SELECT 
TO authenticated
USING (is_superadmin() AND created_by = auth.uid());

-- Add admin policies (admin can still see all invoices)
CREATE POLICY "Admin can create invoices" 
ON public.sales_invoices 
FOR INSERT 
TO authenticated
WITH CHECK (is_admin());

CREATE POLICY "Admin can update all invoices" 
ON public.sales_invoices 
FOR UPDATE 
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Admin can delete all invoices" 
ON public.sales_invoices 
FOR DELETE 
TO authenticated
USING (is_admin());

CREATE POLICY "Admin can view all invoices" 
ON public.sales_invoices 
FOR SELECT 
TO authenticated
USING (is_admin());

-- Update policies for sales_invoice_items
DROP POLICY IF EXISTS "Superadmin and admin can manage all invoice items" ON public.sales_invoice_items;

-- Superadmin can only manage invoice items for their own invoices
CREATE POLICY "Superadmin can manage own invoice items" 
ON public.sales_invoice_items 
FOR ALL 
TO authenticated
USING (
  is_superadmin() AND 
  EXISTS (
    SELECT 1 FROM public.sales_invoices 
    WHERE id = sales_invoice_items.invoice_id 
    AND created_by = auth.uid()
  )
)
WITH CHECK (
  is_superadmin() AND 
  EXISTS (
    SELECT 1 FROM public.sales_invoices 
    WHERE id = sales_invoice_items.invoice_id 
    AND created_by = auth.uid()
  )
);

-- Admin can manage all invoice items
CREATE POLICY "Admin can manage all invoice items" 
ON public.sales_invoice_items 
FOR ALL 
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());