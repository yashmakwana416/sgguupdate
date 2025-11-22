-- Drop salesperson-related tables and their dependencies
-- First drop tables that reference salespersons
DROP TABLE IF EXISTS salesperson_transactions CASCADE;
DROP TABLE IF EXISTS salesperson_invoice_items CASCADE; 
DROP TABLE IF EXISTS salesperson_invoices CASCADE;
DROP TABLE IF EXISTS shopkeeper_product_holdings CASCADE;

-- Then drop the main tables
DROP TABLE IF EXISTS salespersons CASCADE;
DROP TABLE IF EXISTS shopkeepers CASCADE;

-- Drop the salesperson invoice number generation function
DROP FUNCTION IF EXISTS generate_salesperson_invoice_number();