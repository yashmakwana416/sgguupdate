-- Create returns table
CREATE TABLE public.returns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  return_number TEXT NOT NULL DEFAULT 'RTN-' || LPAD(nextval('return_number_seq'::regclass)::TEXT, 4, '0'),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  party_id UUID NOT NULL,
  party_name TEXT NOT NULL,
  product_id UUID NOT NULL,
  product_name TEXT NOT NULL,
  quantity_returned NUMERIC NOT NULL CHECK (quantity_returned > 0),
  unit_price NUMERIC NOT NULL DEFAULT 0,
  total_amount NUMERIC GENERATED ALWAYS AS (quantity_returned * unit_price) STORED,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create sequence for return numbers
CREATE SEQUENCE IF NOT EXISTS return_number_seq START 1;

-- Enable Row Level Security
ALTER TABLE public.returns ENABLE ROW LEVEL SECURITY;

-- Create policies for returns
CREATE POLICY "Anyone can create returns" 
ON public.returns 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can view returns" 
ON public.returns 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can update returns" 
ON public.returns 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete returns" 
ON public.returns 
FOR DELETE 
USING (true);

-- Create function to update product stock on return
CREATE OR REPLACE FUNCTION public.update_product_stock_on_return()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increase product stock when return is processed
    UPDATE public.products 
    SET 
      stock_quantity = stock_quantity + NEW.quantity_returned,
      updated_at = now()
    WHERE id = NEW.product_id;
    
    -- Create inventory transaction record
    INSERT INTO public.inventory_transactions (
      product_id,
      product_name,
      type,
      quantity,
      reason,
      reference,
      reference_id
    ) VALUES (
      NEW.product_id,
      NEW.product_name,
      'in',
      NEW.quantity_returned,
      'Return',
      NEW.return_number,
      NEW.id
    );
    
    RETURN NEW;
  END IF;
  
  IF TG_OP = 'UPDATE' THEN
    -- Adjust stock based on quantity difference
    UPDATE public.products 
    SET 
      stock_quantity = stock_quantity - OLD.quantity_returned + NEW.quantity_returned,
      updated_at = now()
    WHERE id = NEW.product_id;
    
    RETURN NEW;
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    -- Reduce stock when return is deleted
    UPDATE public.products 
    SET 
      stock_quantity = stock_quantity - OLD.quantity_returned,
      updated_at = now()
    WHERE id = OLD.product_id;
    
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic stock updates
CREATE TRIGGER update_product_stock_on_return_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.returns
FOR EACH ROW
EXECUTE FUNCTION public.update_product_stock_on_return();

-- Add trigger for updating timestamps
CREATE TRIGGER update_returns_updated_at
BEFORE UPDATE ON public.returns
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();