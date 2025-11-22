-- Update the is_superadmin function to be more robust
CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_uid uuid;
    user_email text;
    profile_email text;
    result boolean := false;
BEGIN
    -- Get current user ID
    current_uid := auth.uid();
    
    IF current_uid IS NULL THEN
        RETURN false;
    END IF;
    
    -- Check in auth.users first
    SELECT email INTO user_email 
    FROM auth.users 
    WHERE id = current_uid;
    
    -- Check in profiles table as backup
    SELECT email INTO profile_email 
    FROM public.profiles 
    WHERE id = current_uid;
    
    -- Return true if either email matches the superadmin email
    result := (user_email = 'smitmodi416@gmail.com') OR (profile_email = 'smitmodi416@gmail.com');
    
    RETURN result;
END;
$$;

-- Create a function to check if current user is admin or superadmin (for better policy management)
CREATE OR REPLACE FUNCTION public.is_admin_or_superadmin()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN is_superadmin() OR EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  );
END;
$$;

-- Update RLS policy for sales_invoices to ensure superadmin has full access
DROP POLICY IF EXISTS "Superadmin can manage all invoices" ON public.sales_invoices;

CREATE POLICY "Superadmin can manage all invoices" 
ON public.sales_invoices 
FOR ALL 
USING (is_superadmin())
WITH CHECK (is_superadmin());