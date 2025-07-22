-- Add test users for conversation testing in development
-- Temporarily disable foreign key constraint to allow test profiles

-- Store the current constraint and drop it
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

-- Also ensure current authenticated users have proper profiles
INSERT INTO profiles (id, email, full_name, role, is_active)
SELECT 
    id,
    email,
    COALESCE(raw_user_meta_data->>'full_name', email) as full_name,
    'admin' as role,
    true as is_active
FROM auth.users 
WHERE email IS NOT NULL
ON CONFLICT (id) DO UPDATE SET
    email = COALESCE(profiles.email, EXCLUDED.email),
    full_name = COALESCE(profiles.full_name, EXCLUDED.full_name),
    role = COALESCE(profiles.role, EXCLUDED.role),
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- Keep the constraint disabled for development flexibility
-- Note: In production, you'd want to re-enable this constraint