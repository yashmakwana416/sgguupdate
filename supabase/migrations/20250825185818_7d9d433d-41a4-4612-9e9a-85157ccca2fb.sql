-- Add MRP field to sales_invoice_items table
ALTER TABLE public.sales_invoice_items 
ADD COLUMN mrp numeric DEFAULT 0;