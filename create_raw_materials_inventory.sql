-- Create raw_materials_inventory table
CREATE TABLE IF NOT EXISTS raw_materials_inventory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  material_name VARCHAR(255) NOT NULL,
  material_code VARCHAR(100),
  category VARCHAR(100),
  unit_of_measurement VARCHAR(50) NOT NULL, -- kg, liters, pieces, meters, etc.
  current_stock DECIMAL(10, 2) DEFAULT 0,
  minimum_stock_level DECIMAL(10, 2) DEFAULT 0,
  maximum_stock_level DECIMAL(10, 2),
  unit_price DECIMAL(10, 2) DEFAULT 0,
  supplier_name VARCHAR(255),
  supplier_contact VARCHAR(100),
  storage_location VARCHAR(255),
  description TEXT,
  last_restocked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_raw_materials_user_id ON raw_materials_inventory(user_id);
CREATE INDEX IF NOT EXISTS idx_raw_materials_category ON raw_materials_inventory(category);
CREATE INDEX IF NOT EXISTS idx_raw_materials_name ON raw_materials_inventory(material_name);

-- Create stock_transactions table to track inventory movements
CREATE TABLE IF NOT EXISTS raw_material_stock_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  material_id UUID NOT NULL REFERENCES raw_materials_inventory(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_type VARCHAR(50) NOT NULL, -- 'IN' for stock in, 'OUT' for stock out, 'ADJUSTMENT' for corrections
  quantity DECIMAL(10, 2) NOT NULL,
  unit_price DECIMAL(10, 2),
  total_value DECIMAL(10, 2),
  reference_number VARCHAR(100),
  notes TEXT,
  transaction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for transactions
CREATE INDEX IF NOT EXISTS idx_stock_transactions_material_id ON raw_material_stock_transactions(material_id);
CREATE INDEX IF NOT EXISTS idx_stock_transactions_user_id ON raw_material_stock_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_stock_transactions_date ON raw_material_stock_transactions(transaction_date);

-- Enable Row Level Security
ALTER TABLE raw_materials_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE raw_material_stock_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for raw_materials_inventory
-- Superadmins can do everything
CREATE POLICY "Superadmins can view all raw materials"
  ON raw_materials_inventory FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'superadmin'
    )
  );

CREATE POLICY "Superadmins can insert raw materials"
  ON raw_materials_inventory FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'superadmin'
    )
  );

CREATE POLICY "Superadmins can update raw materials"
  ON raw_materials_inventory FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'superadmin'
    )
  );

CREATE POLICY "Superadmins can delete raw materials"
  ON raw_materials_inventory FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'superadmin'
    )
  );

-- RLS Policies for raw_material_stock_transactions
CREATE POLICY "Superadmins can view all transactions"
  ON raw_material_stock_transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'superadmin'
    )
  );

CREATE POLICY "Superadmins can insert transactions"
  ON raw_material_stock_transactions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'superadmin'
    )
  );

CREATE POLICY "Superadmins can update transactions"
  ON raw_material_stock_transactions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'superadmin'
    )
  );

CREATE POLICY "Superadmins can delete transactions"
  ON raw_material_stock_transactions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'superadmin'
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_raw_materials_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_raw_materials_inventory_updated_at
  BEFORE UPDATE ON raw_materials_inventory
  FOR EACH ROW
  EXECUTE FUNCTION update_raw_materials_updated_at();

-- Add comments for documentation
COMMENT ON TABLE raw_materials_inventory IS 'Stores raw materials inventory for manufacturing/production';
COMMENT ON TABLE raw_material_stock_transactions IS 'Tracks all stock movements for raw materials';
COMMENT ON COLUMN raw_materials_inventory.unit_of_measurement IS 'Unit like kg, liters, pieces, meters, etc.';
COMMENT ON COLUMN raw_material_stock_transactions.transaction_type IS 'IN for receiving stock, OUT for consumption, ADJUSTMENT for corrections';
