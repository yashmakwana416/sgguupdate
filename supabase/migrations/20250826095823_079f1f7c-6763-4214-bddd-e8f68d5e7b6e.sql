-- Phase 1: Security Fixes - Fix public access vulnerabilities
-- Update RLS policies for critical tables that currently allow public access

-- Fix purchase_orders policies
DROP POLICY IF EXISTS "Anyone can manage purchase_orders" ON public.purchase_orders;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmin and admin can manage purchase_orders" 
ON public.purchase_orders 
FOR ALL 
USING (is_admin_or_superadmin())
WITH CHECK (is_admin_or_superadmin());

-- Fix purchase_invoices policies  
DROP POLICY IF EXISTS "Anyone can manage purchase_invoices" ON public.purchase_invoices;
ALTER TABLE public.purchase_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmin and admin can manage purchase_invoices" 
ON public.purchase_invoices 
FOR ALL 
USING (is_admin_or_superadmin())
WITH CHECK (is_admin_or_superadmin());

-- Fix purchase_order_items policies
DROP POLICY IF EXISTS "Anyone can manage purchase_order_items" ON public.purchase_order_items;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmin and admin can manage purchase_order_items" 
ON public.purchase_order_items 
FOR ALL 
USING (is_admin_or_superadmin())
WITH CHECK (is_admin_or_superadmin());

-- Fix purchase_invoice_items policies
DROP POLICY IF EXISTS "Anyone can manage purchase_invoice_items" ON public.purchase_invoice_items;
ALTER TABLE public.purchase_invoice_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmin and admin can manage purchase_invoice_items" 
ON public.purchase_invoice_items 
FOR ALL 
USING (is_admin_or_superadmin())
WITH CHECK (is_admin_or_superadmin());

-- Fix inventory_transactions policies
DROP POLICY IF EXISTS "Anyone can manage inventory_transactions" ON public.inventory_transactions;
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmin and admin can manage inventory_transactions" 
ON public.inventory_transactions 
FOR ALL 
USING (is_admin_or_superadmin())
WITH CHECK (is_admin_or_superadmin());

-- Fix replacement_items policies
DROP POLICY IF EXISTS "Anyone can manage replacement_items" ON public.replacement_items;
ALTER TABLE public.replacement_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmin and admin can manage replacement_items" 
ON public.replacement_items 
FOR ALL 
USING (is_admin_or_superadmin())
WITH CHECK (is_admin_or_superadmin());

-- Phase 2: Remove Department System
-- Drop departments table and related constraints
DROP TABLE IF EXISTS public.departments CASCADE;

-- Update user_roles table to remove department dependency
ALTER TABLE public.user_roles DROP COLUMN IF EXISTS department_id;

-- Update user_roles RLS policies to be role-based only
DROP POLICY IF EXISTS "Superadmin can manage all user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;

CREATE POLICY "Superadmin can manage all user roles" 
ON public.user_roles 
FOR ALL 
USING (is_superadmin())
WITH CHECK (is_superadmin());

CREATE POLICY "Users can view own roles" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() = user_id);

-- Create helper function to check if user is admin (not superadmin)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  );
END;
$$;