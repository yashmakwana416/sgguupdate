-- Delete all sales invoice items first (due to foreign key relationships)
DELETE FROM sales_invoice_items;

-- Delete all sales invoices
DELETE FROM sales_invoices;