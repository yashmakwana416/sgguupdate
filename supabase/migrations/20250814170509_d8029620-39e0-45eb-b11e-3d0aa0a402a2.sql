-- Create a more comprehensive fix for the superadmin functionality
-- First, ensure the profile for smitmodi416@gmail.com exists
INSERT INTO public.profiles (id, email, first_name, last_name, created_at, updated_at)
SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'first_name', 'Smith'),
    COALESCE(au.raw_user_meta_data->>'last_name', 'Modi'),
    now(),
    now()
FROM auth.users au
WHERE au.email = 'smitmodi416@gmail.com'
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    first_name = COALESCE(EXCLUDED.first_name, profiles.first_name),
    last_name = COALESCE(EXCLUDED.last_name, profiles.last_name),
    updated_at = now();

-- Verify profile exists
DO $$
DECLARE
    profile_count integer;
BEGIN
    SELECT COUNT(*) INTO profile_count
    FROM public.profiles
    WHERE email = 'smitmodi416@gmail.com';
    
    IF profile_count = 0 THEN
        RAISE EXCEPTION 'Profile for smitmodi416@gmail.com not created successfully';
    ELSE
        RAISE NOTICE 'Profile exists for smitmodi416@gmail.com (count: %)', profile_count;
    END IF;
END $$;

-- Update the superadmin function to be even more robust and add debugging
CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $function$
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
    
    -- Check in profiles table
    SELECT email INTO profile_email 
    FROM public.profiles 
    WHERE id = current_uid;
    
    -- Return true if either email matches
    result := (user_email = 'smitmodi416@gmail.com') OR (profile_email = 'smitmodi416@gmail.com');
    
    RETURN result;
END;
$function$;

-- Grant necessary permissions for the function
GRANT EXECUTE ON FUNCTION public.is_superadmin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_superadmin() TO anon;