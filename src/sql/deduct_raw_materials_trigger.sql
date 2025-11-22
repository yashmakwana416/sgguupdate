-- Function to deduct raw materials when an invoice item is inserted
CREATE OR REPLACE FUNCTION deduct_raw_materials()
RETURNS TRIGGER AS $$
DECLARE
    recipe_record RECORD;
    total_deduction NUMERIC;
BEGIN
    -- Loop through all raw materials associated with the product in the invoice item
    FOR recipe_record IN 
        SELECT raw_material_id, quantity_grams 
        FROM product_raw_materials 
        WHERE product_id = NEW.product_id
    LOOP
        -- Calculate total grams to deduct: quantity per unit * number of units sold
        total_deduction := recipe_record.quantity_grams * NEW.quantity;

        -- Update the raw_materials inventory
        -- We update both grams and kg columns to keep them in sync
        UPDATE raw_materials
        SET current_stock_grams = current_stock_grams - total_deduction,
            current_stock_kg = (current_stock_grams - total_deduction) / 1000.0
        WHERE id = recipe_record.raw_material_id;
        
    END LOOP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call the function after insertion into sales_invoice_items
DROP TRIGGER IF EXISTS trigger_deduct_raw_materials ON sales_invoice_items;
CREATE TRIGGER trigger_deduct_raw_materials
AFTER INSERT ON sales_invoice_items
FOR EACH ROW
EXECUTE FUNCTION deduct_raw_materials();
