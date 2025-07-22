-- Seed test data for dogs and locations
-- Run this in Supabase SQL Editor to have test data for conversation creation

-- Insert test locations
INSERT INTO locations (id, name, description, latitude, longitude) VALUES 
(
    '550e8400-e29b-41d4-a716-446655441001',
    'Bangkok City Center',
    'Central Bangkok area with high stray dog population',
    13.7563,
    100.5018
),
(
    '550e8400-e29b-41d4-a716-446655441002',
    'Koh Phangan',
    'Beautiful island with many stray dogs needing help',
    9.7384,
    100.0077
),
(
    '550e8400-e29b-41d4-a716-446655441003',
    'Chiang Mai Old City',
    'Historic area with active animal rescue community',
    18.7883,
    98.9853
)
ON CONFLICT (id) DO NOTHING;

-- Insert test dogs
INSERT INTO dogs (id, name, breed, age_months, gender, size, color, status, description, health_status, location_id, finder_contact, photos, created_by) VALUES 
(
    '550e8400-e29b-41d4-a716-446655442001',
    'Max',
    'Golden Retriever Mix',
    24,
    'male',
    'large',
    'golden',
    'found',
    'Friendly golden retriever mix found near the park. Very social and good with kids.',
    'healthy',
    '550e8400-e29b-41d4-a716-446655441001',
    'contact@rescue.com',
    '["https://images.unsplash.com/photo-1552053831-71594a27632d?w=400"]',
    '550e8400-e29b-41d4-a716-446655440001'
),
(
    '550e8400-e29b-41d4-a716-446655442002',
    'Luna',
    'Street Dog',
    12,
    'female',
    'medium',
    'brown and white',
    'needs_medical_attention',
    'Sweet female dog found with minor injuries. Needs veterinary care.',
    'injured',
    '550e8400-e29b-41d4-a716-446655441002',
    'help@straysafe.com',
    '["https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400"]',
    '550e8400-e29b-41d4-a716-446655440002'
),
(
    '550e8400-e29b-41d4-a716-446655442003',
    'Buddy',
    'Labrador Mix',
    36,
    'male',
    'large',
    'black',
    'adopted',
    'Happy success story! Buddy found his forever home.',
    'healthy',
    '550e8400-e29b-41d4-a716-446655441003',
    'success@adoption.com',
    '["https://images.unsplash.com/photo-1551717743-49959800b1f6?w=400"]',
    '550e8400-e29b-41d4-a716-446655440003'
)
ON CONFLICT (id) DO NOTHING;