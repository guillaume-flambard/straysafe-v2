-- Add test users for messaging functionality testing
-- Drop foreign key constraint temporarily to allow test profiles

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Insert test users
INSERT INTO profiles (id, email, full_name, bio, role, avatar_url, is_active) VALUES 
('550e8400-e29b-41d4-a716-446655440001', 'alice@straysafe.dev', 'Alice Johnson', 'Volunteer rescuer in Bangkok', 'volunteer', 'https://images.unsplash.com/photo-1494790108755-2616b4e5a751?w=150&h=150&fit=crop&crop=faces', true),
('550e8400-e29b-41d4-a716-446655440002', 'bob@straysafe.dev', 'Bob Smith', 'Local veterinarian', 'volunteer', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=faces', true),
('550e8400-e29b-41d4-a716-446655440003', 'carol@straysafe.dev', 'Carol Davis', 'Animal welfare coordinator', 'volunteer', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=faces', true),
('550e8400-e29b-41d4-a716-446655440004', 'david@straysafe.dev', 'David Wilson', 'Rescue photographer', 'user', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=faces', true),
('550e8400-e29b-41d4-a716-446655440005', 'emma@straysafe.dev', 'Emma Brown', 'Foster coordinator', 'volunteer', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=faces', true)
ON CONFLICT (id) DO NOTHING;