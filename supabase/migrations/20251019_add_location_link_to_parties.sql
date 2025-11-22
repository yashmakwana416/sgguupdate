-- Add location_link column to parties table if it doesn't exist
-- This migration is idempotent and safe to run multiple times

ALTER TABLE public.parties 
ADD COLUMN IF NOT EXISTS location_link TEXT;

-- Add comment to document the column
COMMENT ON COLUMN public.parties.location_link IS 'Google Maps link or any location URL for the party address';
