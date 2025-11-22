-- Allow superadmin to view all sales invoices
CREATE POLICY "superadmin_read_all_invoices"
ON public.sales_invoices
FOR SELECT
TO authenticated
USING (is_superadmin());

-- Allow superadmin to view all sales invoice items
CREATE POLICY "superadmin_read_all_invoice_items"
ON public.sales_invoice_items
FOR SELECT
TO authenticated
USING (is_superadmin());