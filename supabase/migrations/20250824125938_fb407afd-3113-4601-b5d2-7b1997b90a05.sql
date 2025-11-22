-- Create sales invoices table
CREATE TABLE public.sales_invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_number TEXT NOT NULL UNIQUE,
  customer_id UUID REFERENCES public.parties(id),
  customer_name TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  tax_amount NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sales invoice items table
CREATE TABLE public.sales_invoice_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES public.sales_invoices(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  product_name TEXT NOT NULL,
  quantity NUMERIC NOT NULL,
  price NUMERIC NOT NULL,
  tax_rate NUMERIC NOT NULL DEFAULT 0,
  amount NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.sales_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_invoice_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for sales_invoices
CREATE POLICY "Anyone can manage sales_invoices" 
ON public.sales_invoices 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create RLS policies for sales_invoice_items
CREATE POLICY "Anyone can manage sales_invoice_items" 
ON public.sales_invoice_items 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create function to calculate sales invoice item totals
CREATE OR REPLACE FUNCTION public.calculate_sales_invoice_item_total()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate base amount
  NEW.amount = NEW.price * NEW.quantity;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for sales invoice items
CREATE TRIGGER calculate_sales_invoice_item_total_trigger
  BEFORE INSERT OR UPDATE ON public.sales_invoice_items
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_sales_invoice_item_total();

-- Create function to update sales invoice totals
CREATE OR REPLACE FUNCTION public.update_sales_invoice_totals()
RETURNS TRIGGER AS $$
BEGIN
  -- Update invoice totals when items change
  IF TG_TABLE_NAME = 'sales_invoice_items' THEN
    UPDATE public.sales_invoices 
    SET 
      subtotal = (
        SELECT COALESCE(SUM(amount), 0) 
        FROM public.sales_invoice_items 
        WHERE invoice_id = COALESCE(NEW.invoice_id, OLD.invoice_id)
      ),
      tax_amount = (
        SELECT COALESCE(SUM(amount * tax_rate / 100), 0)
        FROM public.sales_invoice_items 
        WHERE invoice_id = COALESCE(NEW.invoice_id, OLD.invoice_id)
      ),
      updated_at = now()
    WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);
    
    -- Update total = subtotal + tax_amount
    UPDATE public.sales_invoices 
    SET total = subtotal + tax_amount
    WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger for sales invoice totals
CREATE TRIGGER update_sales_invoice_totals_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.sales_invoice_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_sales_invoice_totals();

-- Create function to update product stock when sales invoice is created
CREATE OR REPLACE FUNCTION public.update_product_stock_on_sale()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Reduce product stock when sale item is added
    UPDATE public.products 
    SET 
      stock_quantity = stock_quantity - NEW.quantity,
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
      'out',
      NEW.quantity,
      'Sale',
      (SELECT invoice_number FROM public.sales_invoices WHERE id = NEW.invoice_id),
      NEW.invoice_id
    );
    
    RETURN NEW;
  END IF;
  
  IF TG_OP = 'UPDATE' THEN
    -- Adjust stock based on quantity difference
    UPDATE public.products 
    SET 
      stock_quantity = stock_quantity + OLD.quantity - NEW.quantity,
      updated_at = now()
    WHERE id = NEW.product_id;
    
    RETURN NEW;
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    -- Add back stock when sale item is deleted
    UPDATE public.products 
    SET 
      stock_quantity = stock_quantity + OLD.quantity,
      updated_at = now()
    WHERE id = OLD.product_id;
    
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for product stock updates
CREATE TRIGGER update_product_stock_on_sale_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.sales_invoice_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_product_stock_on_sale();

-- Create function to generate sales invoice numbers
CREATE OR REPLACE FUNCTION public.generate_sales_invoice_number()
RETURNS TRIGGER AS $$
DECLARE
  next_number INTEGER;
BEGIN
  IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
    -- Get the next invoice number
    SELECT COALESCE(MAX(
      CAST(SUBSTRING(invoice_number FROM 'INV-(\d+)') AS INTEGER)
    ), 0) + 1 
    INTO next_number
    FROM public.sales_invoices 
    WHERE invoice_number ~ '^INV-\d+$';
    
    -- Set the invoice number
    NEW.invoice_number := 'INV-' || LPAD(next_number::TEXT, 4, '0');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-generating invoice numbers
CREATE TRIGGER generate_sales_invoice_number_trigger
  BEFORE INSERT ON public.sales_invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_sales_invoice_number();

-- Create updated_at trigger for sales_invoices
CREATE TRIGGER update_sales_invoices_updated_at
  BEFORE UPDATE ON public.sales_invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();