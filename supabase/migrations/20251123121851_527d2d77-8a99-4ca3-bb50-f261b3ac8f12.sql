-- Create packaging_logs table to track daily packaging entries
CREATE TABLE IF NOT EXISTS public.packaging_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  kg_packed NUMERIC NOT NULL CHECK (kg_packed > 0),
  raw_materials_used JSONB NOT NULL DEFAULT '[]'::jsonb,
  packaging_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_packaging_logs_product_id ON public.packaging_logs(product_id);
CREATE INDEX idx_packaging_logs_date ON public.packaging_logs(packaging_date DESC);
CREATE INDEX idx_packaging_logs_created_by ON public.packaging_logs(created_by);

-- Enable RLS
ALTER TABLE public.packaging_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Superadmin only
CREATE POLICY "Superadmins can view all packaging logs"
  ON public.packaging_logs
  FOR SELECT
  USING (is_superadmin());

CREATE POLICY "Superadmins can insert packaging logs"
  ON public.packaging_logs
  FOR INSERT
  WITH CHECK (is_superadmin());

CREATE POLICY "Superadmins can update packaging logs"
  ON public.packaging_logs
  FOR UPDATE
  USING (is_superadmin());

CREATE POLICY "Superadmins can delete packaging logs"
  ON public.packaging_logs
  FOR DELETE
  USING (is_superadmin());

-- Trigger to update updated_at
CREATE TRIGGER update_packaging_logs_updated_at
  BEFORE UPDATE ON public.packaging_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();