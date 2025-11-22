-- Update RLS policies so users only see their own invoices
-- Drop existing invoice policies
DROP POLICY IF EXISTS "Superadmin can manage all invoices" ON public.sales_invoices;
DROP POLICY IF EXISTS "Admin can manage own invoices only" ON public.sales_invoices;
DROP POLICY IF EXISTS "distributor_read_own_invoices" ON public.sales_invoices;
DROP POLICY IF EXISTS "distributor_insert_own_invoices" ON public.sales_invoices;
DROP POLICY IF EXISTS "distributor_update_own_invoices" ON public.sales_invoices;
DROP POLICY IF EXISTS "distributor_delete_own_invoices" ON public.sales_invoices;

-- Create simple user-scoped policies for invoices
CREATE POLICY "users_read_own_invoices"
ON public.sales_invoices FOR SELECT
USING (created_by = auth.uid());

CREATE POLICY "users_insert_own_invoices"
ON public.sales_invoices FOR INSERT
WITH CHECK (created_by = auth.uid());

CREATE POLICY "users_update_own_invoices"
ON public.sales_invoices FOR UPDATE
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

CREATE POLICY "users_delete_own_invoices"
ON public.sales_invoices FOR DELETE
USING (created_by = auth.uid());

-- Drop existing invoice items policies
DROP POLICY IF EXISTS "Superadmin can manage all invoice items" ON public.sales_invoice_items;
DROP POLICY IF EXISTS "Admin can manage own invoice items only" ON public.sales_invoice_items;
DROP POLICY IF EXISTS "distributor_read_own_invoice_items" ON public.sales_invoice_items;
DROP POLICY IF EXISTS "distributor_insert_own_invoice_items" ON public.sales_invoice_items;
DROP POLICY IF EXISTS "distributor_update_own_invoice_items" ON public.sales_invoice_items;
DROP POLICY IF EXISTS "distributor_delete_own_invoice_items" ON public.sales_invoice_items;

-- Create simple user-scoped policies for invoice items
CREATE POLICY "users_read_own_invoice_items"
ON public.sales_invoice_items FOR SELECT
USING (EXISTS (
  SELECT 1 FROM sales_invoices 
  WHERE sales_invoices.id = sales_invoice_items.invoice_id 
  AND sales_invoices.created_by = auth.uid()
));

CREATE POLICY "users_insert_own_invoice_items"
ON public.sales_invoice_items FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM sales_invoices 
  WHERE sales_invoices.id = sales_invoice_items.invoice_id 
  AND sales_invoices.created_by = auth.uid()
));

CREATE POLICY "users_update_own_invoice_items"
ON public.sales_invoice_items FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM sales_invoices 
  WHERE sales_invoices.id = sales_invoice_items.invoice_id 
  AND sales_invoices.created_by = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM sales_invoices 
  WHERE sales_invoices.id = sales_invoice_items.invoice_id 
  AND sales_invoices.created_by = auth.uid()
));

CREATE POLICY "users_delete_own_invoice_items"
ON public.sales_invoice_items FOR DELETE
USING (EXISTS (
  SELECT 1 FROM sales_invoices 
  WHERE sales_invoices.id = sales_invoice_items.invoice_id 
  AND sales_invoices.created_by = auth.uid()
));