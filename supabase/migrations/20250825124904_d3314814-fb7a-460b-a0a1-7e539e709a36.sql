-- Fix RLS policies for parties table to allow proper soft delete
-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can update parties" ON public.parties;
DROP POLICY IF EXISTS "Anyone can delete parties" ON public.parties;

-- Recreate update policy with proper WITH CHECK clause
CREATE POLICY "Anyone can update parties" 
ON public.parties 
FOR UPDATE 
USING (true)
WITH CHECK (true);

-- Recreate delete policy
CREATE POLICY "Anyone can delete parties" 
ON public.parties 
FOR DELETE 
USING (true);