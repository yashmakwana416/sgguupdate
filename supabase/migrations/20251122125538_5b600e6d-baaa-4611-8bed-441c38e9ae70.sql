    recipe_details text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
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