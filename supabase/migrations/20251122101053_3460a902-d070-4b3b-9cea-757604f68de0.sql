-- Create table for product raw material recipes
CREATE TABLE IF NOT EXISTS public.product_raw_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  raw_material_id UUID NOT NULL REFERENCES public.raw_materials(id) ON DELETE CASCADE,
  quantity_grams NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(product_id, raw_material_id)
);

-- Enable RLS
ALTER TABLE public.product_raw_materials ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Superadmin can manage product raw materials"
ON public.product_raw_materials
FOR ALL
USING (is_superadmin())
WITH CHECK (is_superadmin());

CREATE POLICY "Anyone can view product raw materials"
ON public.product_raw_materials
FOR SELECT
USING (true);

-- Add updated_at trigger
CREATE TRIGGER update_product_raw_materials_updated_at
BEFORE UPDATE ON public.product_raw_materials
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Add index for better query performance
CREATE INDEX idx_product_raw_materials_product_id ON public.product_raw_materials(product_id);
CREATE INDEX idx_product_raw_materials_raw_material_id ON public.product_raw_materials(raw_material_id);