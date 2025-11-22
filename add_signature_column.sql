-- Add signature_name column to distributor_settings table
ALTER TABLE distributor_settings 
ADD COLUMN IF NOT EXISTS signature_name text DEFAULT 'આપણો વિશ્વાસુ પ્રજાપતિ મહેશ';

-- Update the RLS policies to ensure the new column is covered (The existing policies cover the whole table, so this is just a check)
-- The previous policies used "ON distributor_settings", which applies to all columns.

-- If you haven't run the previous RLS SQL, run it now.
-- If you have, this ALTER TABLE is sufficient to add the field.
