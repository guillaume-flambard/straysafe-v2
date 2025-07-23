-- Fix for specific user stuck in loading loop
-- Run this in Supabase SQL Editor

-- Insert the missing user profile manually
INSERT INTO users (id, email, name, role, location_id) VALUES (
  '0d9fc181-e452-4916-a919-98ca3bffc9b7',
  (SELECT email FROM auth.users WHERE id = '0d9fc181-e452-4916-a919-98ca3bffc9b7'),
  'User',
  'volunteer', 
  '550e8400-e29b-41d4-a716-446655440001'
) ON CONFLICT (id) DO NOTHING;

-- Check if the user profile now exists
SELECT * FROM users WHERE id = '0d9fc181-e452-4916-a919-98ca3bffc9b7';