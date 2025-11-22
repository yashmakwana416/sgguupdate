-- Enable Row Level Security on the distributor_settings table
ALTER TABLE distributor_settings ENABLE ROW LEVEL SECURITY;

-- Remove existing policies if any (to avoid conflicts)
DROP POLICY IF EXISTS "Distributors can view own settings" ON distributor_settings;
DROP POLICY IF EXISTS "Distributors can insert own settings" ON distributor_settings;
DROP POLICY IF EXISTS "Distributors can update own settings" ON distributor_settings;
DROP POLICY IF EXISTS "Distributors can delete own settings" ON distributor_settings;

-- Policy for SELECT: Only users with 'distributor' role can view their own settings
CREATE POLICY "Distributors can view own settings" ON distributor_settings
FOR SELECT
USING (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'distributor'
  )
);

-- Policy for INSERT: Only users with 'distributor' role can insert their own settings
CREATE POLICY "Distributors can insert own settings" ON distributor_settings
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'distributor'
  )
);

-- Policy for UPDATE: Only users with 'distributor' role can update their own settings
CREATE POLICY "Distributors can update own settings" ON distributor_settings
FOR UPDATE
USING (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'distributor'
  )
)
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'distributor'
  )
);

-- Policy for DELETE: Only users with 'distributor' role can delete their own settings
CREATE POLICY "Distributors can delete own settings" ON distributor_settings
FOR DELETE
USING (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'distributor'
  )
);
