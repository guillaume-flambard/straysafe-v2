-- MANUAL SEED SCRIPT - Run this in Supabase Dashboard > SQL Editor
-- This creates test users for development and conversation testing

-- Option 1: Temporarily allow test profiles (recommended for development)
-- Disable foreign key constraint temporarily
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Insert test user profiles
INSERT INTO profiles (id, email, full_name, bio, role, avatar_url, is_active) VALUES 
-- Test user 1
(
    '550e8400-e29b-41d4-a716-446655440001',
    'alice@straysafe.dev',
    'Alice Johnson',
    'Dog lover and volunteer rescuer in Bangkok. Active in animal welfare community.',
    'volunteer',
    'https://images.unsplash.com/photo-1494790108755-2616b4e5a751?w=150&h=150&fit=crop&crop=faces',
    true
),
-- Test user 2
(
    '550e8400-e29b-41d4-a716-446655440002', 
    'bob.smith@straysafe.dev',
    'Bob Smith',
    'Local veterinarian helping stray animals across Thailand.',
    'volunteer',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=faces',
    true
),
-- Test user 3
(
    '550e8400-e29b-41d4-a716-446655440003',
    'carol.davis@straysafe.dev', 
    'Carol Davis',
    'Animal welfare coordinator and foster home manager.',
    'volunteer',
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=faces',
    true
),
-- Test user 4
(
    '550e8400-e29b-41d4-a716-446655440004',
    'david.wilson@straysafe.dev',
    'David Wilson', 
    'Photographer documenting rescue efforts and success stories.',
    'user',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=faces',
    true
),
-- Test user 5
(
    '550e8400-e29b-41d4-a716-446655440005',
    'emma.brown@straysafe.dev',
    'Emma Brown',
    'Foster home coordinator helping dogs find temporary and permanent homes.',
    'volunteer', 
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=faces',
    true
),
-- Test user 6
(
    '550e8400-e29b-41d4-a716-446655440006',
    'frank.miller@straysafe.dev',
    'Frank Miller',
    'Local businessman supporting animal rescue financially and through volunteering.',
    'user',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=faces',
    true
)
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    bio = EXCLUDED.bio,
    role = EXCLUDED.role,
    avatar_url = EXCLUDED.avatar_url,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- Optional: Re-enable foreign key constraint (comment out if you want to keep test users)
-- ALTER TABLE profiles ADD CONSTRAINT profiles_id_fkey 
--     FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Verify the users were created
SELECT id, email, full_name, role FROM profiles WHERE email LIKE '%straysafe.dev' ORDER BY full_name;