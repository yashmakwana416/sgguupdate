-- Function to deduct inventory for a specific invoice
-- This is designed to be called via RPC from the frontend
CREATE OR REPLACE FUNCTION deduct_inventory_for_invoice(invoice_id UUID)
RETURNS VOID AS $$
DECLARE
    invoice_item RECORD;
    recipe_item RECORD;
    total_deduction NUMERIC;
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

            -- Update the raw material stock
            -- Ensure we don't go below zero (optional, but good for data integrity)
            UPDATE raw_materials
            SET 
                current_stock_grams = GREATEST(0, current_stock_grams - total_deduction),
                current_stock_kg = GREATEST(0, (current_stock_grams - total_deduction) / 1000.0),
                updated_at = NOW()
            WHERE id = recipe_item.raw_material_id;
            
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
