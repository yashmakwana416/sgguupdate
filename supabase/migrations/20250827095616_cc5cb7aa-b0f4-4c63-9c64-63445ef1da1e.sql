-- Create a function to check if user is admin only (not superadmin)
CREATE OR REPLACE FUNCTION public.is_admin_only()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Return true only if user is admin but NOT superadmin
  RETURN is_admin() AND NOT is_superadmin();
END;
$function$

-- Drop all existing policies for sales_invoices to start fresh
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

-- Create strict policies for sales_invoices - each user type only sees their own
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

-- Drop all existing policies for sales_invoice_items
DROP POLICY IF EXISTS "Distributors can manage own invoice items" ON public.sales_invoice_items;
DROP POLICY IF EXISTS "Superadmin can manage own invoice items" ON public.sales_invoice_items;
DROP POLICY IF EXISTS "Admin can manage all invoice items" ON public.sales_invoice_items;

-- Create strict policies for sales_invoice_items - each user type only manages items for their own invoices
CREATE POLICY "Distributors can manage own invoice items only" 
ON public.sales_invoice_items 
FOR ALL 
TO authenticated
USING (
  is_distributor() AND 
  EXISTS (
    SELECT 1 FROM public.sales_invoices 
    WHERE id = sales_invoice_items.invoice_id 
    AND created_by = auth.uid()
  )
)
WITH CHECK (
  is_distributor() AND 
  EXISTS (
    SELECT 1 FROM public.sales_invoices 
    WHERE id = sales_invoice_items.invoice_id 
    AND created_by = auth.uid()
  )
);

CREATE POLICY "Superadmin can manage own invoice items only" 
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

CREATE POLICY "Admin can manage own invoice items only" 
ON public.sales_invoice_items 
FOR ALL 
TO authenticated
USING (
  is_admin_only() AND 
  EXISTS (
    SELECT 1 FROM public.sales_invoices 
    WHERE id = sales_invoice_items.invoice_id 
    AND created_by = auth.uid()
  )
)
WITH CHECK (
  is_admin_only() AND 
  EXISTS (
    SELECT 1 FROM public.sales_invoices 
    WHERE id = sales_invoice_items.invoice_id 
    AND created_by = auth.uid()
  )
);