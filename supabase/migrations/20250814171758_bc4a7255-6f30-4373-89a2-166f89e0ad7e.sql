-- Ensure we have all necessary tables and fields for salesperson invoice functionality

-- Update salesperson_invoices table to include all necessary fields if missing
ALTER TABLE public.salesperson_invoices 
ADD COLUMN IF NOT EXISTS invoice_type text DEFAULT 'sale',
ADD COLUMN IF NOT EXISTS payment_terms text DEFAULT 'immediate',
ADD COLUMN IF NOT EXISTS discount_percentage numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS discount_amount numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS round_off_amount numeric DEFAULT 0;

-- Update salesperson_invoice_items to ensure all product fields are present
ALTER TABLE public.salesperson_invoice_items
ADD COLUMN IF NOT EXISTS hsn_code text,
ADD COLUMN IF NOT EXISTS tax_rate numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS tax_amount numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS discount_percentage numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS discount_amount numeric DEFAULT 0;

-- Create function to automatically calculate line totals with tax and discount
CREATE OR REPLACE FUNCTION calculate_salesperson_invoice_line_total()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate discount amount if percentage is provided
  IF NEW.discount_percentage > 0 THEN
    NEW.discount_amount = (NEW.selling_price * NEW.quantity * NEW.discount_percentage / 100);
  END IF;
  
  -- Calculate base amount after discount
  NEW.line_total = (NEW.selling_price * NEW.quantity) - COALESCE(NEW.discount_amount, 0);
  
  -- Calculate tax amount
  NEW.tax_amount = NEW.line_total * COALESCE(NEW.tax_rate, 0) / 100;
  
  -- Final line total includes tax
  NEW.line_total = NEW.line_total + NEW.tax_amount;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic line total calculation
DROP TRIGGER IF EXISTS trigger_calculate_salesperson_invoice_line_total ON public.salesperson_invoice_items;
CREATE TRIGGER trigger_calculate_salesperson_invoice_line_total
  BEFORE INSERT OR UPDATE ON public.salesperson_invoice_items
  FOR EACH ROW
  EXECUTE FUNCTION calculate_salesperson_invoice_line_total();

-- Update the existing invoice totals function to handle new fields
CREATE OR REPLACE FUNCTION public.update_salesperson_invoice_totals()
RETURNS TRIGGER AS $$
BEGIN
  -- Update invoice totals when items change
  IF TG_TABLE_NAME = 'salesperson_invoice_items' THEN
    UPDATE public.salesperson_invoices 
    SET 
      subtotal = (
        SELECT COALESCE(SUM(selling_price * quantity - COALESCE(discount_amount, 0)), 0) 
        FROM public.salesperson_invoice_items 
        WHERE invoice_id = COALESCE(NEW.invoice_id, OLD.invoice_id)
      ),
      gst_amount = (
        SELECT COALESCE(SUM(tax_amount), 0)
        FROM public.salesperson_invoice_items 
        WHERE invoice_id = COALESCE(NEW.invoice_id, OLD.invoice_id)
      ),
      total_amount = (
        SELECT COALESCE(SUM(line_total), 0) + COALESCE(
          (SELECT round_off_amount FROM public.salesperson_invoices WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id)), 0
        )
        FROM public.salesperson_invoice_items 
        WHERE invoice_id = COALESCE(NEW.invoice_id, OLD.invoice_id)
      ),
      updated_at = now()
    WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_salesperson_invoices_salesperson_id ON public.salesperson_invoices(salesperson_id);
CREATE INDEX IF NOT EXISTS idx_salesperson_invoices_shopkeeper_id ON public.salesperson_invoices(shopkeeper_id);
CREATE INDEX IF NOT EXISTS idx_salesperson_invoices_date ON public.salesperson_invoices(invoice_date);
CREATE INDEX IF NOT EXISTS idx_salesperson_invoice_items_invoice_id ON public.salesperson_invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_salesperson_invoice_items_product_id ON public.salesperson_invoice_items(product_id);