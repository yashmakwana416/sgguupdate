-- Fix the deduct_inventory_for_invoice function to correctly calculate from total stock
-- The bug was it only looked at current_stock_grams, not the combined kg + grams

CREATE OR REPLACE FUNCTION public.deduct_inventory_for_invoice(invoice_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    invoice_item RECORD;
    recipe_item RECORD;
    total_deduction NUMERIC;
    current_total_grams NUMERIC;
    new_total_grams NUMERIC;
    new_kg NUMERIC;
    new_grams NUMERIC;
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

            -- Get current total stock in grams (kg * 1000 + grams)
            SELECT 
                (current_stock_kg * 1000) + current_stock_grams
            INTO 
                current_total_grams
            FROM raw_materials
            WHERE id = recipe_item.raw_material_id;

            -- Calculate new total stock and clamp at zero
            new_total_grams := GREATEST(0, current_total_grams - total_deduction);
            
            -- Convert back to kg and grams
            new_kg := FLOOR(new_total_grams / 1000);
            new_grams := new_total_grams - (new_kg * 1000);

            -- Update the raw material stock
            UPDATE raw_materials
            SET 
                current_stock_kg = new_kg,
                current_stock_grams = new_grams,
                updated_at = NOW()
            WHERE id = recipe_item.raw_material_id;
            
        END LOOP;
    END LOOP;
END;
$function$;