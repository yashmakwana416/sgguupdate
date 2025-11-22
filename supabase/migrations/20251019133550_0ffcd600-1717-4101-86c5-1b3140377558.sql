-- Ensure smxth@gmail.com exists in profiles
INSERT INTO public.profiles (id, email, first_name, last_name)
VALUES (
  '6f0d2e00-8e2f-48fc-99b2-c7d167ac6649',
  'smxth@gmail.com',
  'SMX',
  'TH'
)
ON CONFLICT (id) DO UPDATE 
SET email = EXCLUDED.email,
    updated_at = now();

-- Add admin role for smxth@gmail.com
INSERT INTO public.user_roles (user_id, role)
VALUES (
  '6f0d2e00-8e2f-48fc-99b2-c7d167ac6649',
  'admin'
)
ON CONFLICT (user_id, role) DO NOTHING;