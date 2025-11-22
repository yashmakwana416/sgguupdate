-- Create departments table
CREATE TABLE public.departments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  code TEXT UNIQUE,
  manager_id UUID,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

-- Create policies for departments (public access for now since no auth is set up)
CREATE POLICY "Anyone can view active departments" 
ON public.departments 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Anyone can create departments" 
ON public.departments 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update departments" 
ON public.departments 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete departments" 
ON public.departments 
FOR DELETE 
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_departments_updated_at
BEFORE UPDATE ON public.departments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_departments_name ON public.departments(name);
CREATE INDEX idx_departments_code ON public.departments(code);
CREATE INDEX idx_departments_active ON public.departments(is_active);

-- Insert some sample data
INSERT INTO public.departments (name, description, code) VALUES
('Human Resources', 'Manages employee relations and policies', 'HR'),
('Information Technology', 'Handles technology infrastructure and development', 'IT'),
('Finance', 'Manages financial operations and accounting', 'FIN'),
('Sales', 'Handles customer acquisition and revenue generation', 'SALES'),
('Marketing', 'Manages brand promotion and market research', 'MKT');