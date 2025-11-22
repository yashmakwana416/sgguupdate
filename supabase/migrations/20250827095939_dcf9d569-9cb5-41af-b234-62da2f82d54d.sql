-- Update invoice items policies for strict isolation
DROP POLICY IF EXISTS "Distributors can manage own invoice items" ON public.sales_invoice_items;
DROP POLICY IF EXISTS "Superadmin can manage own invoice items" ON public.sales_invoice_items;
DROP POLICY IF EXISTS "Admin can manage all invoice items" ON public.sales_invoice_items;

-- Create strict policies for invoice items - each user type only manages items for their own invoices
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