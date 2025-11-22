-- Add distributor role support and data isolation

-- First, update the role options to include distributor in user_roles table
-- The role column already exists and accepts text, so we just need to update policies

-- Add creator tracking columns to tables that need data isolation
ALTER TABLE public.parties ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);
ALTER TABLE public.sales_invoices ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);
ALTER TABLE public.returns ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- Set default values for existing records (assign to superadmin or first admin)
UPDATE public.parties SET created_by = (
  SELECT id FROM auth.users WHERE email = 'smitmodi416@gmail.com' LIMIT 1
) WHERE created_by IS NULL;

UPDATE public.products SET created_by = (
  SELECT id FROM auth.users WHERE email = 'smitmodi416@gmail.com' LIMIT 1
) WHERE created_by IS NULL;

UPDATE public.sales_invoices SET created_by = (
  SELECT id FROM auth.users WHERE email = 'smitmodi416@gmail.com' LIMIT 1
) WHERE created_by IS NULL;

UPDATE public.returns SET created_by = (
  SELECT id FROM auth.users WHERE email = 'smitmodi416@gmail.com' LIMIT 1
) WHERE created_by IS NULL;

-- Create function to check if user is distributor
CREATE OR REPLACE FUNCTION public.is_distributor()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'distributor'
  );
END;
$$;

-- Create function to check if user is admin or superadmin
CREATE OR REPLACE FUNCTION public.is_admin_or_superadmin()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
BEGIN
  RETURN is_superadmin() OR EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  );
END;
$$;

-- Update RLS policies for parties table with data isolation
DROP POLICY IF EXISTS "Anyone can create parties" ON public.parties;
DROP POLICY IF EXISTS "Public can manage parties" ON public.parties;
DROP POLICY IF EXISTS "Authenticated users can manage parties" ON public.parties;

-- Parties policies with data isolation
CREATE POLICY "Superadmin and admin can view all parties" 
ON public.parties FOR SELECT 
USING (is_admin_or_superadmin());

CREATE POLICY "Distributors can view own parties" 
ON public.parties FOR SELECT 
USING (is_distributor() AND created_by = auth.uid());

CREATE POLICY "Superadmin and admin can create parties" 
ON public.parties FOR INSERT 
WITH CHECK (is_admin_or_superadmin());

CREATE POLICY "Distributors can create own parties" 
ON public.parties FOR INSERT 
WITH CHECK (is_distributor() AND created_by = auth.uid());

CREATE POLICY "Superadmin and admin can update all parties" 
ON public.parties FOR UPDATE 
USING (is_admin_or_superadmin());

CREATE POLICY "Distributors can update own parties" 
ON public.parties FOR UPDATE 
USING (is_distributor() AND created_by = auth.uid());

CREATE POLICY "Superadmin and admin can delete all parties" 
ON public.parties FOR DELETE 
USING (is_admin_or_superadmin());

CREATE POLICY "Distributors can delete own parties" 
ON public.parties FOR DELETE 
USING (is_distributor() AND created_by = auth.uid());

-- Update RLS policies for products table with data isolation
DROP POLICY IF EXISTS "Anyone can create products" ON public.products;
DROP POLICY IF EXISTS "Anyone can delete products" ON public.products;
DROP POLICY IF EXISTS "Anyone can update products" ON public.products;
DROP POLICY IF EXISTS "Anyone can view active products" ON public.products;

-- Products policies with data isolation
CREATE POLICY "Superadmin and admin can view all products" 
ON public.products FOR SELECT 
USING (is_admin_or_superadmin() AND is_active = true);

CREATE POLICY "Distributors can view own products" 
ON public.products FOR SELECT 
USING (is_distributor() AND created_by = auth.uid() AND is_active = true);

CREATE POLICY "Superadmin and admin can create products" 
ON public.products FOR INSERT 
WITH CHECK (is_admin_or_superadmin());

CREATE POLICY "Distributors can create own products" 
ON public.products FOR INSERT 
WITH CHECK (is_distributor() AND created_by = auth.uid());

CREATE POLICY "Superadmin and admin can update all products" 
ON public.products FOR UPDATE 
USING (is_admin_or_superadmin());

CREATE POLICY "Distributors can update own products" 
ON public.products FOR UPDATE 
USING (is_distributor() AND created_by = auth.uid());

CREATE POLICY "Superadmin and admin can delete all products" 
ON public.products FOR DELETE 
USING (is_admin_or_superadmin());

CREATE POLICY "Distributors can delete own products" 
ON public.products FOR DELETE 
USING (is_distributor() AND created_by = auth.uid());

-- Update RLS policies for sales_invoices table with data isolation
DROP POLICY IF EXISTS "Anyone can manage sales_invoices" ON public.sales_invoices;

-- Sales invoices policies with data isolation
CREATE POLICY "Superadmin and admin can view all invoices" 
ON public.sales_invoices FOR SELECT 
USING (is_admin_or_superadmin());

CREATE POLICY "Distributors can view own invoices" 
ON public.sales_invoices FOR SELECT 
USING (is_distributor() AND created_by = auth.uid());

CREATE POLICY "Superadmin and admin can create invoices" 
ON public.sales_invoices FOR INSERT 
WITH CHECK (is_admin_or_superadmin());

CREATE POLICY "Distributors can create own invoices" 
ON public.sales_invoices FOR INSERT 
WITH CHECK (is_distributor() AND created_by = auth.uid());

CREATE POLICY "Superadmin and admin can update all invoices" 
ON public.sales_invoices FOR UPDATE 
USING (is_admin_or_superadmin());

CREATE POLICY "Distributors can update own invoices" 
ON public.sales_invoices FOR UPDATE 
USING (is_distributor() AND created_by = auth.uid());

CREATE POLICY "Superadmin and admin can delete all invoices" 
ON public.sales_invoices FOR DELETE 
USING (is_admin_or_superadmin());

CREATE POLICY "Distributors can delete own invoices" 
ON public.sales_invoices FOR DELETE 
USING (is_distributor() AND created_by = auth.uid());

-- Update RLS policies for returns table with data isolation
DROP POLICY IF EXISTS "Anyone can create returns" ON public.returns;
DROP POLICY IF EXISTS "Anyone can delete returns" ON public.returns;
DROP POLICY IF EXISTS "Anyone can update returns" ON public.returns;
DROP POLICY IF EXISTS "Anyone can view returns" ON public.returns;

-- Returns policies with data isolation
CREATE POLICY "Superadmin and admin can view all returns" 
ON public.returns FOR SELECT 
USING (is_admin_or_superadmin());

CREATE POLICY "Distributors can view own returns" 
ON public.returns FOR SELECT 
USING (is_distributor() AND created_by = auth.uid());

CREATE POLICY "Superadmin and admin can create returns" 
ON public.returns FOR INSERT 
WITH CHECK (is_admin_or_superadmin());

CREATE POLICY "Distributors can create own returns" 
ON public.returns FOR INSERT 
WITH CHECK (is_distributor() AND created_by = auth.uid());

CREATE POLICY "Superadmin and admin can update all returns" 
ON public.returns FOR UPDATE 
USING (is_admin_or_superadmin());

CREATE POLICY "Distributors can update own returns" 
ON public.returns FOR UPDATE 
USING (is_distributor() AND created_by = auth.uid());

CREATE POLICY "Superadmin and admin can delete all returns" 
ON public.returns FOR DELETE 
USING (is_admin_or_superadmin());

CREATE POLICY "Distributors can delete own returns" 
ON public.returns FOR DELETE 
USING (is_distributor() AND created_by = auth.uid());

-- Create triggers to automatically set created_by for new records
CREATE OR REPLACE FUNCTION public.set_created_by()
RETURNS TRIGGER AS $$
BEGIN
  NEW.created_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for automatic created_by assignment
DROP TRIGGER IF EXISTS set_parties_created_by ON public.parties;
CREATE TRIGGER set_parties_created_by
  BEFORE INSERT ON public.parties
  FOR EACH ROW
  EXECUTE FUNCTION public.set_created_by();

DROP TRIGGER IF EXISTS set_products_created_by ON public.products;
CREATE TRIGGER set_products_created_by
  BEFORE INSERT ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.set_created_by();

DROP TRIGGER IF EXISTS set_sales_invoices_created_by ON public.sales_invoices;
CREATE TRIGGER set_sales_invoices_created_by
  BEFORE INSERT ON public.sales_invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.set_created_by();

DROP TRIGGER IF EXISTS set_returns_created_by ON public.returns;
CREATE TRIGGER set_returns_created_by
  BEFORE INSERT ON public.returns
  FOR EACH ROW
  EXECUTE FUNCTION public.set_created_by();