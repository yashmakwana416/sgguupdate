-- Phase 1: Fix Database Schema & Security
-- Make created_by NOT NULL (this will ensure all parties have an owner)
ALTER TABLE public.parties ALTER COLUMN created_by SET NOT NULL;

-- Phase 2: Fix RLS Policies - Complete overhaul for distributors
-- Drop all existing distributor policies
DROP POLICY IF EXISTS "Distributors can create parties" ON public.parties;
DROP POLICY IF EXISTS "Distributors can soft delete own parties" ON public.parties;
DROP POLICY IF EXISTS "Distributors can update own active parties" ON public.parties;
DROP POLICY IF EXISTS "Distributors can view own active parties" ON public.parties;

-- Create comprehensive policies for distributors
-- 1. SELECT: Allow distributors to view their own parties (both active and inactive)
CREATE POLICY "Distributors can view own parties" 
ON public.parties 
FOR SELECT 
TO authenticated
USING (is_distributor() AND created_by = auth.uid());

-- 2. INSERT: Allow distributors to create parties (trigger will set created_by)
CREATE POLICY "Distributors can create parties" 
ON public.parties 
FOR INSERT 
TO authenticated
WITH CHECK (is_distributor() AND created_by = auth.uid());

-- 3. UPDATE: Allow distributors to update their own parties
CREATE POLICY "Distributors can update own parties" 
ON public.parties 
FOR UPDATE 
TO authenticated
USING (is_distributor() AND created_by = auth.uid())
WITH CHECK (is_distributor() AND created_by = auth.uid());

-- 4. DELETE: Allow distributors to hard delete their own parties
CREATE POLICY "Distributors can delete own parties" 
ON public.parties 
FOR DELETE 
TO authenticated
USING (is_distributor() AND created_by = auth.uid());