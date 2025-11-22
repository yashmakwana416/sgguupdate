-- Create shopkeepers table (extends customer concept for retail shopkeepers)
CREATE TABLE public.shopkeepers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  shop_name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  credit_limit NUMERIC DEFAULT 0,
  current_balance NUMERIC DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create shopkeeper_product_holdings table to track products held by each shopkeeper
CREATE TABLE public.shopkeeper_product_holdings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shopkeeper_id UUID NOT NULL,
  product_id UUID NOT NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  total_value NUMERIC NOT NULL DEFAULT 0,
  last_updated_by TEXT, -- salesperson name
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(shopkeeper_id, product_id)
);

-- Create salesperson_transactions table to track all transactions
CREATE TABLE public.salesperson_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shopkeeper_id UUID NOT NULL,
  shopkeeper_name TEXT NOT NULL,
  transaction_type TEXT NOT NULL, -- 'stock_update', 'payment', 'debt_adjustment'
  amount NUMERIC NOT NULL DEFAULT 0,
  description TEXT,
  payment_method TEXT, -- 'cash', 'upi', 'bank_transfer', etc.
  salesperson_name TEXT NOT NULL,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create shopkeeper_payments table for tracking payments and debts
CREATE TABLE public.shopkeeper_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shopkeeper_id UUID NOT NULL,
  shopkeeper_name TEXT NOT NULL,
  payment_amount NUMERIC NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  salesperson_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.shopkeepers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopkeeper_product_holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salesperson_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopkeeper_payments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for shopkeepers
CREATE POLICY "Anyone can manage shopkeepers" 
ON public.shopkeepers 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create RLS policies for shopkeeper_product_holdings
CREATE POLICY "Anyone can manage shopkeeper_product_holdings" 
ON public.shopkeeper_product_holdings 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create RLS policies for salesperson_transactions
CREATE POLICY "Anyone can manage salesperson_transactions" 
ON public.salesperson_transactions 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create RLS policies for shopkeeper_payments
CREATE POLICY "Anyone can manage shopkeeper_payments" 
ON public.shopkeeper_payments 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create function to update shopkeeper balance
CREATE OR REPLACE FUNCTION public.update_shopkeeper_balance()
RETURNS TRIGGER AS $$
BEGIN
  -- Update shopkeeper balance when holdings change
  IF TG_TABLE_NAME = 'shopkeeper_product_holdings' THEN
    UPDATE public.shopkeepers 
    SET current_balance = (
      SELECT COALESCE(SUM(total_value), 0) 
      FROM public.shopkeeper_product_holdings 
      WHERE shopkeeper_id = COALESCE(NEW.shopkeeper_id, OLD.shopkeeper_id)
    ),
    updated_at = now()
    WHERE id = COALESCE(NEW.shopkeeper_id, OLD.shopkeeper_id);
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic balance updates
CREATE TRIGGER update_shopkeeper_balance_on_holdings_change
  AFTER INSERT OR UPDATE OR DELETE ON public.shopkeeper_product_holdings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_shopkeeper_balance();

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_shopkeepers_updated_at
  BEFORE UPDATE ON public.shopkeepers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_shopkeeper_product_holdings_updated_at
  BEFORE UPDATE ON public.shopkeeper_product_holdings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();