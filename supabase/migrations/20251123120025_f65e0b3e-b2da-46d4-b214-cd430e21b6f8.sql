-- Drop the problematic trigger that overwrites current_stock_kg based on current_stock_grams
DROP TRIGGER IF EXISTS normalize_raw_material_stock_trg ON public.raw_materials;

-- Drop the function that was causing the issue
DROP FUNCTION IF EXISTS public.normalize_raw_material_stock();