-- Insert sample salespersons
INSERT INTO public.salespersons (name, employee_id, phone, email, territory, commission_rate) 
VALUES 
('John Smith', 'EMP001', '+91-9876543210', 'john.smith@company.com', 'North Zone', 5.0),
('Sarah Johnson', 'EMP002', '+91-9876543211', 'sarah.johnson@company.com', 'South Zone', 4.5);

-- Insert sample shopkeepers
INSERT INTO public.shopkeepers (name, shop_name, phone, address, credit_limit) 
VALUES 
('Raj Kumar', 'Kumar General Store', '+91-9123456789', '123 Main Street, City', 50000),
('Amit Sharma', 'Sharma Electronics', '+91-9123456790', '456 Market Road, City', 75000),
('Priya Patel', 'Patel Provisions', '+91-9123456791', '789 Commerce Street, City', 40000);

-- Insert sample products
INSERT INTO public.products (name, sku, description, price, unit, hsn, tax_rate, stock_quantity) 
VALUES 
('Rice - Basmati', 'RICE001', 'Premium Basmati Rice 1kg', 120.00, 'kg', '1006', 5.0, 100),
('Cooking Oil', 'OIL001', 'Refined Sunflower Oil 1L', 180.00, 'ltr', '1507', 12.0, 50),
('Sugar', 'SUGAR001', 'White Sugar 1kg', 45.00, 'kg', '1701', 0.0, 200),
('Tea Powder', 'TEA001', 'Premium Tea Powder 250g', 85.00, 'gm', '0902', 12.0, 75),
('Detergent', 'DET001', 'Washing Powder 1kg', 95.00, 'kg', '3402', 18.0, 80);