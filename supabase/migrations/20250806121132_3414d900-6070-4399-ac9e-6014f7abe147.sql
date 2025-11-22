-- Create customers table
CREATE TABLE public.customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  gstin TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for customers
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for customers
CREATE POLICY "Anyone can view active customers" 
ON public.customers 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Anyone can create customers" 
ON public.customers 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update customers" 
ON public.customers 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete customers" 
ON public.customers 
FOR DELETE 
USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_customers_updated_at
BEFORE UPDATE ON public.customers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update GST rates table to enable RLS
ALTER TABLE public.gst_rates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for gst_rates
CREATE POLICY "Anyone can view active gst_rates" 
ON public.gst_rates 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Anyone can create gst_rates" 
ON public.gst_rates 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update gst_rates" 
ON public.gst_rates 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete gst_rates" 
ON public.gst_rates 
FOR DELETE 
USING (true);

-- Add trigger for gst_rates updated_at
CREATE TRIGGER update_gst_rates_updated_at
BEFORE UPDATE ON public.gst_rates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS for products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for products
CREATE POLICY "Anyone can view active products" 
ON public.products 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Anyone can create products" 
ON public.products 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update products" 
ON public.products 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete products" 
ON public.products 
FOR DELETE 
USING (true);

-- Add trigger for products updated_at
CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS for suppliers
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for suppliers
CREATE POLICY "Anyone can view active suppliers" 
ON public.suppliers 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Anyone can create suppliers" 
ON public.suppliers 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update suppliers" 
ON public.suppliers 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete suppliers" 
ON public.suppliers 
FOR DELETE 
USING (true);

-- Add trigger for suppliers updated_at
CREATE TRIGGER update_suppliers_updated_at
BEFORE UPDATE ON public.suppliers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS for all other tables
ALTER TABLE public.sales_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for all tables (open access for now)
CREATE POLICY "Anyone can manage sales_invoices" ON public.sales_invoices FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can manage sales_invoice_items" ON public.sales_invoice_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can manage purchase_orders" ON public.purchase_orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can manage purchase_order_items" ON public.purchase_order_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can manage purchase_invoices" ON public.purchase_invoices FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can manage purchase_invoice_items" ON public.purchase_invoice_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can manage inventory_transactions" ON public.inventory_transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can manage payments" ON public.payments FOR ALL USING (true) WITH CHECK (true);

-- Add triggers for updated_at columns where they exist
CREATE TRIGGER update_sales_invoices_updated_at
BEFORE UPDATE ON public.sales_invoices
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_purchase_orders_updated_at
BEFORE UPDATE ON public.purchase_orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_purchase_invoices_updated_at
BEFORE UPDATE ON public.purchase_invoices
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();