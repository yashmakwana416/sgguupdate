-- Update products table with enhanced schema and constraints
ALTER TABLE public.products 
ADD CONSTRAINT products_sku_unique UNIQUE (sku),
ADD CONSTRAINT products_price_positive CHECK (price >= 0),
ADD CONSTRAINT products_stock_quantity_non_negative CHECK (stock_quantity >= 0),
ADD CONSTRAINT products_tax_rate_valid CHECK (tax_rate >= 0 AND tax_rate <= 100);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);
CREATE INDEX IF NOT EXISTS idx_products_name ON public.products(name);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active);

-- Update RLS policies to restrict to superadmin only
DROP POLICY IF EXISTS "Anyone can create products" ON public.products;
DROP POLICY IF EXISTS "Anyone can update products" ON public.products;
DROP POLICY IF EXISTS "Anyone can delete products" ON public.products;
DROP POLICY IF EXISTS "Anyone can view active products" ON public.products;

-- Create new superadmin-only policies
CREATE POLICY "Anyone can view active products" 
ON public.products 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Superadmin can create products" 
ON public.products 
FOR INSERT 
WITH CHECK (is_superadmin());

CREATE POLICY "Superadmin can update products" 
ON public.products 
FOR UPDATE 
USING (is_superadmin())
WITH CHECK (is_superadmin());

CREATE POLICY "Superadmin can delete products" 
ON public.products 
FOR DELETE 
USING (is_superadmin());

-- Add trigger for updated_at
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();