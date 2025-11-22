-- Fix the RLS policy issue with a simpler, more direct approach
-- Drop the problematic policies and create simpler ones
DROP POLICY IF EXISTS "Distributors can view admin products" ON public.products;
DROP POLICY IF EXISTS "Superadmin and admin can view all products" ON public.products;

-- Create a simple policy that allows all authenticated users to view active products
-- This is more straightforward and avoids complex subqueries that might be causing issues
CREATE POLICY "Users can view active products" 
ON public.products 
FOR SELECT 
TO authenticated
USING (is_active = true);

-- Create separate policies for admin/superadmin management
CREATE POLICY "Admins can manage products" 
ON public.products 
FOR ALL 
TO authenticated
USING (is_admin_or_superadmin()) 
WITH CHECK (is_admin_or_superadmin());

-- Update database functions to fix security warnings by adding proper search_path
CREATE OR REPLACE FUNCTION public.is_admin_or_superadmin()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN is_superadmin() OR EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_distributor()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'distributor'
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  );
END;
$function$;