-- Create raw materials inventory table
CREATE TABLE public.raw_materials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  current_stock_kg NUMERIC NOT NULL DEFAULT 0,
  current_stock_grams NUMERIC NOT NULL DEFAULT 0,
  total_stock_grams NUMERIC GENERATED ALWAYS AS (current_stock_kg * 1000 + current_stock_grams) STORED,
  minimum_stock_kg NUMERIC DEFAULT 0,
  minimum_stock_grams NUMERIC DEFAULT 0,
  unit_cost_per_kg NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create raw material usage tracking table
CREATE TABLE public.raw_material_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  raw_material_id UUID NOT NULL REFERENCES public.raw_materials(id) ON DELETE CASCADE,
  raw_material_name TEXT NOT NULL,
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  used_kg NUMERIC NOT NULL DEFAULT 0,
  used_grams NUMERIC NOT NULL DEFAULT 0,
  total_used_grams NUMERIC GENERATED ALWAYS AS (used_kg * 1000 + used_grams) STORED,
  notes TEXT,
  entered_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.raw_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.raw_material_usage ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for raw_materials
CREATE POLICY "Anyone can view raw materials" 
ON public.raw_materials 
FOR SELECT 
USING (true);

CREATE POLICY "Superadmin can manage raw materials" 
ON public.raw_materials 
FOR ALL 
USING (is_superadmin())
WITH CHECK (is_superadmin());

-- Create RLS policies for raw_material_usage
CREATE POLICY "Anyone can view raw material usage" 
ON public.raw_material_usage 
FOR SELECT 
USING (true);

CREATE POLICY "Superadmin can manage raw material usage" 
ON public.raw_material_usage 
FOR ALL 
USING (is_superadmin())
WITH CHECK (is_superadmin());

-- Create function to update raw material stock when usage is recorded
CREATE OR REPLACE FUNCTION public.update_raw_material_stock()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Deduct usage from current stock
    UPDATE public.raw_materials 
    SET 
      current_stock_kg = FLOOR((total_stock_grams - NEW.total_used_grams) / 1000),
      current_stock_grams = (total_stock_grams - NEW.total_used_grams) % 1000,
      updated_at = now()
    WHERE id = NEW.raw_material_id;
    
    RETURN NEW;
  END IF;
  
  IF TG_OP = 'UPDATE' THEN
    -- Adjust stock based on the difference
    UPDATE public.raw_materials 
    SET 
      current_stock_kg = FLOOR((total_stock_grams + OLD.total_used_grams - NEW.total_used_grams) / 1000),
      current_stock_grams = (total_stock_grams + OLD.total_used_grams - NEW.total_used_grams) % 1000,
      updated_at = now()
    WHERE id = NEW.raw_material_id;
    
    RETURN NEW;
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    -- Add back the deleted usage to stock
    UPDATE public.raw_materials 
    SET 
      current_stock_kg = FLOOR((total_stock_grams + OLD.total_used_grams) / 1000),
      current_stock_grams = (total_stock_grams + OLD.total_used_grams) % 1000,
      updated_at = now()
    WHERE id = OLD.raw_material_id;
    
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic stock updates
CREATE TRIGGER raw_material_stock_update_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.raw_material_usage
  FOR EACH ROW
  EXECUTE FUNCTION public.update_raw_material_stock();

-- Create trigger for updated_at column
CREATE TRIGGER update_raw_materials_updated_at
  BEFORE UPDATE ON public.raw_materials
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert the required raw materials
INSERT INTO public.raw_materials (name) VALUES 
  ('Adad Dal'),
  ('Mung Dal'),
  ('Teekha Mari'),
  ('Hing'),
  ('Mari Kani'),
  ('Soda'),
  ('Jeeru');

-- Create indexes for better performance
CREATE INDEX idx_raw_material_usage_date ON public.raw_material_usage(usage_date);
CREATE INDEX idx_raw_material_usage_material ON public.raw_material_usage(raw_material_id);
CREATE INDEX idx_raw_materials_name ON public.raw_materials(name);