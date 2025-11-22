-- Fix the deduct_inventory_for_invoice function to correctly calculate stock levels
-- BUG: The original function calculated current_stock_kg from OLD current_stock_grams, not the NEW value
CREATE OR REPLACE FUNCTION public.deduct_inventory_for_invoice(invoice_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    invoice_item RECORD;
    recipe_item RECORD;
    total_deduction NUMERIC;
    new_stock_grams NUMERIC;
    new_stock_kg NUMERIC;
BEGIN
    -- Loop through all items in the invoice
    FOR invoice_item IN 
        SELECT product_id, quantity 
        FROM sales_invoice_items 
        WHERE sales_invoice_items.invoice_id = deduct_inventory_for_invoice.invoice_id
    LOOP
        -- For each product, find its recipe (raw materials)
        FOR recipe_item IN 
            SELECT raw_material_id, quantity_grams 
            FROM product_raw_materials 
            WHERE product_id = invoice_item.product_id
        LOOP
            -- Calculate total grams to deduct for this raw material
            total_deduction := recipe_item.quantity_grams * invoice_item.quantity;

            -- Calculate new stock values (can't go below zero)
            SELECT 
                GREATEST(0, current_stock_grams - total_deduction),
                GREATEST(0, total_stock_grams - total_deduction)
            INTO 
                new_stock_grams,
                -- Calculate new total_stock_grams (if column exists)
                total_deduction
            FROM raw_materials
            WHERE id = recipe_item.raw_material_id;

            -- Update the raw material stock with correctly calculated values
            UPDATE raw_materials
            SET 
                current_stock_grams = new_stock_grams,
                current_stock_kg = FLOOR(new_stock_grams / 1000),  -- Integer kg
                total_stock_grams = GREATEST(0, total_stock_grams - total_deduction),
                updated_at = NOW()
            WHERE id = recipe_item.raw_material_id;
            
        END LOOP;
    END LOOP;
END;
$function$;

-- Create helper function to get product recipes for the UI
CREATE OR REPLACE FUNCTION public.get_product_recipes()
RETURNS TABLE (
    product_id uuid,
    recipe_count bigint,
    recipe_details text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT 
        p.id as product_id,
        COUNT(prm.id) as recipe_count,
        STRING_AGG(rm.name || ' (' || prm.quantity_grams || 'g)', ', ' ORDER BY rm.name) as recipe_details
    FROM products p 
    LEFT JOIN product_raw_materials prm ON p.id = prm.product_id 
    LEFT JOIN raw_materials rm ON prm.raw_material_id = rm.id 
    GROUP BY p.id
$$;