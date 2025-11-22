-- Create replacement_items table for tracking warranty/replacement items in invoices
CREATE TABLE public.replacement_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID NOT NULL,
  product_id UUID NOT NULL,
  product_name TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 1,
  replacement_date DATE NOT NULL DEFAULT CURRENT_DATE,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.replacement_items ENABLE ROW LEVEL SECURITY;

-- Create policies for replacement items
CREATE POLICY "Anyone can manage replacement_items" 
ON public.replacement_items 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_replacement_items_updated_at
BEFORE UPDATE ON public.replacement_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();