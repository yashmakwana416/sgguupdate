-- Fix RLS policies for sales_invoice_items to ensure proper data separation
-- First, drop the existing overly permissive policy
DROP POLICY IF EXISTS "Anyone can manage sales_invoice_items" ON public.sales_invoice_items;

-- Create proper RLS policies for sales_invoice_items
-- Distributors can only manage invoice items for their own invoices
CREATE POLICY "Distributors can manage own invoice items" 
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

-- Superadmin and admin can manage all invoice items
CREATE POLICY "Superadmin and admin can manage all invoice items" 
ON public.sales_invoice_items 
FOR ALL 
TO authenticated
USING (is_admin_or_superadmin())
WITH CHECK (is_admin_or_superadmin());