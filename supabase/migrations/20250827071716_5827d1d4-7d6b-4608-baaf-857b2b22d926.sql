-- Update RLS policy for inventory_transactions to allow distributors to insert sales records
DROP POLICY IF EXISTS "Superadmin and admin can manage inventory_transactions" ON public.inventory_transactions;

-- Create separate policies for better granular control
CREATE POLICY "Superadmin and admin can manage all inventory_transactions" 
ON public.inventory_transactions 
FOR ALL 
USING (is_admin_or_superadmin()) 
WITH CHECK (is_admin_or_superadmin());

-- Allow distributors to insert sales-related inventory transactions
CREATE POLICY "Distributors can insert sales inventory transactions" 
ON public.inventory_transactions 
FOR INSERT 
WITH CHECK (is_distributor() AND reason = 'Sale');

-- Allow distributors to view their own sales-related inventory transactions
CREATE POLICY "Distributors can view sales inventory transactions" 
ON public.inventory_transactions 
FOR SELECT 
USING (is_distributor() AND reason = 'Sale');