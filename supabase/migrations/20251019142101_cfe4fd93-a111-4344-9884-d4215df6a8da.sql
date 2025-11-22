-- Add RLS policies for distributors to manage invoices
-- Distributors can manage their own invoices

-- Distributors can view their own invoices
CREATE POLICY "distributor_read_own_invoices"
ON public.sales_invoices FOR SELECT
USING (is_distributor() AND created_by = auth.uid());

-- Distributors can create their own invoices
CREATE POLICY "distributor_insert_own_invoices"
ON public.sales_invoices FOR INSERT
WITH CHECK (is_distributor() AND created_by = auth.uid());

-- Distributors can update their own invoices
CREATE POLICY "distributor_update_own_invoices"
ON public.sales_invoices FOR UPDATE
USING (is_distributor() AND created_by = auth.uid())
WITH CHECK (is_distributor() AND created_by = auth.uid());

-- Distributors can delete their own invoices
CREATE POLICY "distributor_delete_own_invoices"
ON public.sales_invoices FOR DELETE
USING (is_distributor() AND created_by = auth.uid());

-- Distributors can manage their own invoice items
CREATE POLICY "distributor_read_own_invoice_items"
ON public.sales_invoice_items FOR SELECT
USING (is_distributor() AND EXISTS (
  SELECT 1 FROM sales_invoices 
  WHERE sales_invoices.id = sales_invoice_items.invoice_id 
  AND sales_invoices.created_by = auth.uid()
));

CREATE POLICY "distributor_insert_own_invoice_items"
ON public.sales_invoice_items FOR INSERT
WITH CHECK (is_distributor() AND EXISTS (
  SELECT 1 FROM sales_invoices 
  WHERE sales_invoices.id = sales_invoice_items.invoice_id 
  AND sales_invoices.created_by = auth.uid()
));

CREATE POLICY "distributor_update_own_invoice_items"
ON public.sales_invoice_items FOR UPDATE
USING (is_distributor() AND EXISTS (
  SELECT 1 FROM sales_invoices 
  WHERE sales_invoices.id = sales_invoice_items.invoice_id 
  AND sales_invoices.created_by = auth.uid()
))
WITH CHECK (is_distributor() AND EXISTS (
  SELECT 1 FROM sales_invoices 
  WHERE sales_invoices.id = sales_invoice_items.invoice_id 
  AND sales_invoices.created_by = auth.uid()
));

CREATE POLICY "distributor_delete_own_invoice_items"
ON public.sales_invoice_items FOR DELETE
USING (is_distributor() AND EXISTS (
  SELECT 1 FROM sales_invoices 
  WHERE sales_invoices.id = sales_invoice_items.invoice_id 
  AND sales_invoices.created_by = auth.uid()
));