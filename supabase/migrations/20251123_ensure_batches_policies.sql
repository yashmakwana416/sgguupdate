-- Ensure tables exist
CREATE TABLE IF NOT EXISTS batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_name TEXT NOT NULL,
    batch_details TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS batch_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
    raw_material_id UUID NOT NULL REFERENCES raw_materials(id),
    quantity_kg NUMERIC DEFAULT 0,
    quantity_grams NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE batch_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Superadmins can manage batches" ON batches;
DROP POLICY IF EXISTS "Superadmins can manage batch_items" ON batch_items;

-- Create strict policies for Superadmins
-- FOR ALL covers SELECT, INSERT, UPDATE, DELETE
CREATE POLICY "Superadmins can manage batches" ON batches
    FOR ALL
    TO authenticated
    USING (public.is_superadmin())
    WITH CHECK (public.is_superadmin());

CREATE POLICY "Superadmins can manage batch_items" ON batch_items
    FOR ALL
    TO authenticated
    USING (public.is_superadmin())
    WITH CHECK (public.is_superadmin());

-- Grant permissions to authenticated users (RLS will still restrict access)
GRANT ALL ON batches TO authenticated;
GRANT ALL ON batch_items TO authenticated;
GRANT ALL ON batches TO service_role;
GRANT ALL ON batch_items TO service_role;
