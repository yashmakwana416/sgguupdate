-- First, let's add proper foreign key constraints with CASCADE DELETE for clean deletion
-- But check if they already exist

-- Drop existing foreign key if exists
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'sales_invoice_items_product_id_fkey'
    ) THEN
        ALTER TABLE public.sales_invoice_items DROP CONSTRAINT sales_invoice_items_product_id_fkey;
    END IF;
END $$;

-- Add proper foreign key constraint that allows CASCADE DELETE
ALTER TABLE public.sales_invoice_items 
ADD CONSTRAINT sales_invoice_items_product_id_fkey 
FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;

-- Do the same for inventory_transactions if foreign key exists
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'inventory_transactions_product_id_fkey'
    ) THEN
        ALTER TABLE public.inventory_transactions DROP CONSTRAINT inventory_transactions_product_id_fkey;
    END IF;
END $$;

-- Add proper foreign key constraint for inventory_transactions
ALTER TABLE public.inventory_transactions 
ADD CONSTRAINT inventory_transactions_product_id_fkey 
FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;

-- Update the useProducts hook's delete function to handle constraints properly
-- Create a function to safely delete products
CREATE OR REPLACE FUNCTION public.safe_delete_product(product_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    has_dependencies BOOLEAN := FALSE;
BEGIN
    -- Check if product has any dependencies that should prevent deletion
    SELECT EXISTS(
        SELECT 1 FROM purchase_invoice_items WHERE product_id = product_uuid
        UNION
        SELECT 1 FROM purchase_order_items WHERE product_id = product_uuid
    ) INTO has_dependencies;
    
    IF has_dependencies THEN
        -- If has purchase dependencies, do soft delete
        UPDATE products SET is_active = FALSE WHERE id = product_uuid;
        RETURN FALSE; -- Indicates soft delete was performed
    ELSE
        -- Safe to hard delete (sales items and inventory transactions will cascade)
        DELETE FROM products WHERE id = product_uuid;
        RETURN TRUE; -- Indicates hard delete was performed
    END IF;
END;
$$;