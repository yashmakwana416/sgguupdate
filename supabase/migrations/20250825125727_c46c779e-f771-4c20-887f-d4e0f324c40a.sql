-- Simplify RLS policies for parties table since this is an admin application
-- Drop all existing policies
DROP POLICY IF EXISTS "Anyone can create parties" ON public.parties;
DROP POLICY IF EXISTS "Anyone can update parties" ON public.parties;
DROP POLICY IF EXISTS "Anyone can delete parties" ON public.parties;
DROP POLICY IF EXISTS "Anyone can view active parties" ON public.parties;

-- Create simple policies that allow all operations for authenticated users
CREATE POLICY "Authenticated users can manage parties" 
ON public.parties 
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Also allow public access for now to ensure no authentication issues
CREATE POLICY "Public can manage parties" 
ON public.parties 
FOR ALL
TO public
USING (true)
WITH CHECK (true);