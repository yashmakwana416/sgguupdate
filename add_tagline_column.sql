-- Add tagline column to distributor_settings table
ALTER TABLE distributor_settings
ADD COLUMN IF NOT EXISTS tagline TEXT;

-- Add a comment to describe the column
COMMENT ON COLUMN distributor_settings.tagline IS 'Company tagline or motto to display on invoices';
