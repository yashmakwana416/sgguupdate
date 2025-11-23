-- Add batch_items_snapshot column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'batch_orders_log' 
        AND column_name = 'batch_items_snapshot'
    ) THEN
        ALTER TABLE public.batch_orders_log 
        ADD COLUMN batch_items_snapshot jsonb;
    END IF;
END $$;
