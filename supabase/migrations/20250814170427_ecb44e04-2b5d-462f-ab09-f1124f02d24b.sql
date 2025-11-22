-- Fix the superadmin setup for smitmodi416@gmail.com
-- First, let's get the current authenticated user's details
DO $$
DECLARE
    current_user_id uuid;
    current_user_email text;
BEGIN
    -- Get current user from auth.users
    SELECT id, email INTO current_user_id, current_user_email 
    FROM auth.users 
    WHERE email = 'smitmodi416@gmail.com';
    
    -- If user exists, ensure profile record exists
    IF current_user_id IS NOT NULL THEN
        -- Insert or update profile record
        INSERT INTO public.profiles (id, email, first_name, last_name)
        VALUES (current_user_id, current_user_email, 'Smith', 'Modi')
        ON CONFLICT (id) 
        DO UPDATE SET 
            email = EXCLUDED.email,
            first_name = COALESCE(EXCLUDED.first_name, profiles.first_name),
            last_name = COALESCE(EXCLUDED.last_name, profiles.last_name),
            updated_at = now();
        
        RAISE NOTICE 'Profile created/updated for user: %', current_user_email;
    ELSE
        RAISE NOTICE 'User smitmodi416@gmail.com not found in auth.users';
    END IF;
END $$;

-- Also update the superadmin function to be more robust
CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() AND email = 'smitmodi416@gmail.com'
  ) OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND email = 'smitmodi416@gmail.com'
  );
$function$;

-- Update the raw materials RLS policies to be more explicit
DROP POLICY IF EXISTS "Superadmin can manage raw materials" ON public.raw_materials;
DROP POLICY IF EXISTS "Anyone can view raw materials" ON public.raw_materials;

-- Create clearer RLS policies
CREATE POLICY "Superadmin can manage raw materials" 
ON public.raw_materials 
FOR ALL 
TO authenticated
USING (is_superadmin())
WITH CHECK (is_superadmin());

CREATE POLICY "Anyone can view raw materials" 
ON public.raw_materials 
FOR SELECT 
TO authenticated
USING (true);

-- Update raw material usage policies
DROP POLICY IF EXISTS "Superadmin can manage raw material usage" ON public.raw_material_usage;
DROP POLICY IF EXISTS "Anyone can view raw material usage" ON public.raw_material_usage;

CREATE POLICY "Superadmin can manage raw material usage" 
ON public.raw_material_usage 
FOR ALL 
TO authenticated
USING (is_superadmin())
WITH CHECK (is_superadmin());

CREATE POLICY "Anyone can view raw material usage" 
ON public.raw_material_usage 
FOR SELECT 
TO authenticated
USING (true);