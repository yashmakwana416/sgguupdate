-- Function to deduct inventory when batch order is confirmed
CREATE OR REPLACE FUNCTION deduct_inventory_for_batch_order(
    p_batch_id UUID,
    p_batch_name TEXT,
    p_batch_number TEXT,
    p_user_id UUID,
    p_user_name TEXT,
    p_batch_items_snapshot JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_item JSONB;
    v_material_id UUID;
    v_quantity_kg NUMERIC;
    v_quantity_grams NUMERIC;
    v_total_grams NUMERIC;
    v_current_stock_kg NUMERIC;
    v_current_stock_grams NUMERIC;
    v_current_total_grams NUMERIC;
    v_new_total_grams NUMERIC;
    v_new_kg NUMERIC;
    v_new_grams NUMERIC;
    v_order_log_id UUID;
    v_material_name TEXT;
BEGIN
    -- First, check if all materials have sufficient stock
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_batch_items_snapshot)
    LOOP
        v_material_id := (v_item->>'material_id')::UUID;
        v_quantity_kg := COALESCE((v_item->>'quantity_kg')::NUMERIC, 0);
        v_quantity_grams := COALESCE((v_item->>'quantity_grams')::NUMERIC, 0);
        v_total_grams := (v_quantity_kg * 1000) + v_quantity_grams;
        
        -- Get current stock
        SELECT current_stock_kg, current_stock_grams, name
        INTO v_current_stock_kg, v_current_stock_grams, v_material_name
        FROM raw_materials
        WHERE id = v_material_id;
        
        IF v_current_stock_kg IS NULL THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', 'Material not found: ' || COALESCE(v_item->>'material_name', 'Unknown')
            );
        END IF;
        
        v_current_total_grams := (v_current_stock_kg * 1000) + v_current_stock_grams;
        
        -- Check if sufficient stock
        IF v_current_total_grams < v_total_grams THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', 'Insufficient stock for ' || v_material_name || 
                        '. Required: ' || v_total_grams || 'g, Available: ' || v_current_total_grams || 'g'
            );
        END IF;
    END LOOP;
    
    -- All checks passed, insert order log
    INSERT INTO batch_orders_log (
        batch_id,
        batch_name,
        batch_number,
        user_id,
        user_name,
        batch_items_snapshot
    ) VALUES (
        p_batch_id,
        p_batch_name,
        p_batch_number,
        p_user_id,
        p_user_name,
        p_batch_items_snapshot
    )
    RETURNING id INTO v_order_log_id;
    
    -- Now deduct inventory
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_batch_items_snapshot)
    LOOP
        v_material_id := (v_item->>'material_id')::UUID;
        v_quantity_kg := COALESCE((v_item->>'quantity_kg')::NUMERIC, 0);
        v_quantity_grams := COALESCE((v_item->>'quantity_grams')::NUMERIC, 0);
        v_total_grams := (v_quantity_kg * 1000) + v_quantity_grams;
        
        -- Get current stock again
        SELECT current_stock_kg, current_stock_grams
        INTO v_current_stock_kg, v_current_stock_grams
        FROM raw_materials
        WHERE id = v_material_id;
        
        v_current_total_grams := (v_current_stock_kg * 1000) + v_current_stock_grams;
        v_new_total_grams := v_current_total_grams - v_total_grams;
        
        -- Convert back to kg and grams
        v_new_kg := FLOOR(v_new_total_grams / 1000);
        v_new_grams := v_new_total_grams - (v_new_kg * 1000);
        
        -- Update raw materials inventory
        UPDATE raw_materials
        SET 
            current_stock_kg = v_new_kg,
            current_stock_grams = v_new_grams,
            updated_at = NOW()
        WHERE id = v_material_id;
    END LOOP;
    
    RETURN jsonb_build_object(
        'success', true,
        'order_log_id', v_order_log_id,
        'message', 'Batch order logged and inventory deducted successfully'
    );
    
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION deduct_inventory_for_batch_order(UUID, TEXT, TEXT, UUID, TEXT, JSONB) TO authenticated;
