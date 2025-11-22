-- Add MRP field to products table
ALTER TABLE public.products ADD COLUMN mrp numeric NOT NULL DEFAULT 0;

-- Update existing records to have same MRP as current price initially
UPDATE public.products SET mrp = price WHERE mrp = 0;