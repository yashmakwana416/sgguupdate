-- Create user_printers table for persistent Bluetooth printer connections
CREATE TABLE IF NOT EXISTS public.user_printers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    printer_name TEXT NOT NULL,
    printer_mac TEXT NOT NULL,
    printer_device_id TEXT, -- Browser-specific device ID
    last_connected TIMESTAMPTZ DEFAULT NOW(),
    status BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    connection_metadata JSONB DEFAULT '{}', -- Store additional connection info
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, printer_mac)
);

-- Create index for faster queries
CREATE INDEX idx_user_printers_user_id ON public.user_printers(user_id);
CREATE INDEX idx_user_printers_status ON public.user_printers(status);
CREATE INDEX idx_user_printers_default ON public.user_printers(user_id, is_default) WHERE is_default = true;

-- Enable RLS
ALTER TABLE public.user_printers ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own printers" ON public.user_printers
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own printers" ON public.user_printers
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own printers" ON public.user_printers
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own printers" ON public.user_printers
    FOR DELETE USING (auth.uid() = user_id);

-- Function to ensure only one default printer per user
CREATE OR REPLACE FUNCTION ensure_single_default_printer()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_default = true THEN
        UPDATE public.user_printers
        SET is_default = false, updated_at = NOW()
        WHERE user_id = NEW.user_id AND id != NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to maintain single default printer
CREATE TRIGGER maintain_single_default_printer
    BEFORE INSERT OR UPDATE ON public.user_printers
    FOR EACH ROW
    EXECUTE FUNCTION ensure_single_default_printer();

-- Function to update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update timestamp
CREATE TRIGGER update_user_printers_updated_at
    BEFORE UPDATE ON public.user_printers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
