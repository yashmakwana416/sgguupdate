-- Create salesperson invoices table
CREATE TABLE public.salesperson_invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_number TEXT NOT NULL UNIQUE,
  salesperson_id UUID NOT NULL,
  salesperson_name TEXT NOT NULL,
  shopkeeper_id UUID NOT NULL,
  shopkeeper_name TEXT NOT NULL,
  shop_name TEXT NOT NULL,
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  gst_rate NUMERIC NOT NULL DEFAULT 0,
  gst_amount NUMERIC NOT NULL DEFAULT 0,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  total_amount_words TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create salesperson invoice items table
CREATE TABLE public.salesperson_invoice_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES public.salesperson_invoices(id) ON DELETE CASCADE,
  product_id UUID NOT NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  mrp NUMERIC NOT NULL DEFAULT 0,
  selling_price NUMERIC NOT NULL DEFAULT 0,
  line_total NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.salesperson_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salesperson_invoice_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Anyone can manage salesperson_invoices" 
ON public.salesperson_invoices 
FOR ALL 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Anyone can manage salesperson_invoice_items" 
ON public.salesperson_invoice_items 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create function to update invoice totals
CREATE OR REPLACE FUNCTION public.update_salesperson_invoice_totals()
RETURNS TRIGGER AS $$
BEGIN
  -- Update invoice totals when items change
  IF TG_TABLE_NAME = 'salesperson_invoice_items' THEN
    UPDATE public.salesperson_invoices 
    SET 
      subtotal = (
        SELECT COALESCE(SUM(line_total), 0) 
        FROM public.salesperson_invoice_items 
        WHERE invoice_id = COALESCE(NEW.invoice_id, OLD.invoice_id)
      ),
      gst_amount = (
        SELECT COALESCE(SUM(line_total), 0) * (gst_rate / 100)
        FROM public.salesperson_invoice_items 
        WHERE invoice_id = COALESCE(NEW.invoice_id, OLD.invoice_id)
      ),
      total_amount = (
        SELECT COALESCE(SUM(line_total), 0) * (1 + gst_rate / 100)
        FROM public.salesperson_invoice_items 
        WHERE invoice_id = COALESCE(NEW.invoice_id, OLD.invoice_id)
      ),
      updated_at = now()
    WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER update_salesperson_invoice_totals_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.salesperson_invoice_items
  FOR EACH ROW EXECUTE FUNCTION public.update_salesperson_invoice_totals();

CREATE TRIGGER update_salesperson_invoices_updated_at
  BEFORE UPDATE ON public.salesperson_invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to generate invoice number
CREATE OR REPLACE FUNCTION public.generate_salesperson_invoice_number()
RETURNS TEXT AS $$
DECLARE
  next_number INTEGER;
  invoice_number TEXT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 'SP-(\d+)') AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.salesperson_invoices
  WHERE invoice_number ~ '^SP-\d+$';
  
  invoice_number := 'SP-' || LPAD(next_number::TEXT, 6, '0');
  RETURN invoice_number;
END;
$$ LANGUAGE plpgsql;