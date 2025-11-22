-- Update RLS policies for sales_invoices to allow superadmin to see all data
DROP POLICY IF EXISTS "Superadmin can manage own invoices only" ON public.sales_invoices;

CREATE POLICY "Superadmin can manage all invoices" 
ON public.sales_invoices 
FOR ALL 
TO authenticated 
USING (is_superadmin()) 
WITH CHECK (is_superadmin());

-- Update RLS policies for sales_invoice_items to allow superadmin to see all data  
DROP POLICY IF EXISTS "Superadmin can manage own invoice items only" ON public.sales_invoice_items;

CREATE POLICY "Superadmin can manage all invoice items" 
ON public.sales_invoice_items 
FOR ALL 
TO authenticated 
USING (is_superadmin()) 
WITH CHECK (is_superadmin());