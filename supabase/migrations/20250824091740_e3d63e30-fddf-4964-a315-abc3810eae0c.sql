-- Rename suppliers table to parties
ALTER TABLE public.suppliers RENAME TO parties;

-- Update RLS policies to reference new table name
DROP POLICY IF EXISTS "Anyone can create suppliers" ON public.parties;
DROP POLICY IF EXISTS "Anyone can delete suppliers" ON public.parties;
DROP POLICY IF EXISTS "Anyone can update suppliers" ON public.parties;
DROP POLICY IF EXISTS "Anyone can view active suppliers" ON public.parties;

-- Create new RLS policies for parties table
CREATE POLICY "Anyone can create parties" 
ON public.parties 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can delete parties" 
ON public.parties 
FOR DELETE 
USING (true);

CREATE POLICY "Anyone can update parties" 
ON public.parties 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can view active parties" 
ON public.parties 
FOR SELECT 
USING (is_active = true);