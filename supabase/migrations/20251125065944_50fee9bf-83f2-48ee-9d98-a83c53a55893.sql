-- Add paid_amount column to sales_invoices table
ALTER TABLE public.sales_invoices
ADD COLUMN IF NOT EXISTS paid_amount numeric DEFAULT 0;