-- Create locations table first
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS locations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert initial locations
INSERT INTO locations (id, name, description) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'Koh Phangan', 'Island in the Gulf of Thailand'),
  ('550e8400-e29b-41d4-a716-446655440002', 'Chiang Mai', 'Northern Thailand'),
  ('550e8400-e29b-41d4-a716-446655440003', 'Bangkok', 'Capital city of Thailand')
ON CONFLICT (id) DO NOTHING;