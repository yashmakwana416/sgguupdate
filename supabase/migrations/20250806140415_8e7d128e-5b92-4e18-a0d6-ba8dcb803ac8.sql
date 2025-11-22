-- Create salesperson table for detailed profile management
CREATE TABLE public.salespersons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  employee_id TEXT UNIQUE,
  phone TEXT,
  email TEXT,
  address TEXT,
  territory TEXT, -- area or region assigned
  commission_rate NUMERIC DEFAULT 0,
  joining_date DATE DEFAULT CURRENT_DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.salespersons ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for salespersons
CREATE POLICY "Anyone can manage salespersons" 
ON public.salespersons 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Add foreign key reference to existing tables
ALTER TABLE public.salesperson_transactions 
ADD COLUMN salesperson_id UUID REFERENCES public.salespersons(id);

ALTER TABLE public.shopkeeper_payments 
ADD COLUMN salesperson_id UUID REFERENCES public.salespersons(id);

-- Update shopkeeper_product_holdings to include salesperson reference
ALTER TABLE public.shopkeeper_product_holdings 
ADD COLUMN salesperson_id UUID REFERENCES public.salespersons(id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_salespersons_updated_at
  BEFORE UPDATE ON public.salespersons
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();