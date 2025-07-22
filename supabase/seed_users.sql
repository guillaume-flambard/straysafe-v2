-- Insert test users into profiles table for development
-- Note: These are test users for development purposes only

INSERT INTO profiles (id, email, full_name, bio, role, avatar_url) VALUES 
(
    '550e8400-e29b-41d4-a716-446655440001',
    'alice@test.com',
    'Alice Johnson',
    'Dog lover and volunteer rescuer in Bangkok',
    'volunteer',
    'https://images.unsplash.com/photo-1494790108755-2616b4e5a751?w=150'
),
(
    '550e8400-e29b-41d4-a716-446655440002', 
    'bob@test.com',
    'Bob Smith',
    'Local veterinarian helping stray animals',
    'volunteer',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'
),
(
    '550e8400-e29b-41d4-a716-446655440003',
    'carol@test.com', 
    'Carol Davis',
    'Animal welfare coordinator',
    'volunteer',
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150'
),
(
    '550e8400-e29b-41d4-a716-446655440004',
    'david@test.com',
    'David Wilson', 
    'Photographer documenting rescue efforts',
    'user',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150'
),
(
    '550e8400-e29b-41d4-a716-446655440005',
    'emma@test.com',
    'Emma Brown',
    'Foster home coordinator',
    'volunteer', 
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150'
)
ON CONFLICT (id) DO NOTHING;