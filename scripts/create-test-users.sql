-- Create test users with different roles for testing permissions
-- Run this via: supabase db query < scripts/create-test-users.sql

-- Clean up existing test users first (optional)
DELETE FROM auth.users WHERE email LIKE '%@straysafe-test.com';
DELETE FROM profiles WHERE email LIKE '%@straysafe-test.com';

-- Insert test users into auth.users
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token,
  role,
  aud
) VALUES 
  -- Admin user
  (
    '11111111-1111-1111-1111-111111111111',
    '00000000-0000-0000-0000-000000000000',
    'admin@straysafe-test.com',
    crypt('password123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '',
    '',
    'authenticated',
    'authenticated'
  ),
  -- Volunteer user  
  (
    '22222222-2222-2222-2222-222222222222',
    '00000000-0000-0000-0000-000000000000',
    'volunteer@straysafe-test.com',
    crypt('password123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '',
    '',
    'authenticated',
    'authenticated'
  ),
  -- Vet user
  (
    '33333333-3333-3333-3333-333333333333',
    '00000000-0000-0000-0000-000000000000',
    'vet@straysafe-test.com',
    crypt('password123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '',
    '',
    'authenticated',
    'authenticated'
  ),
  -- Viewer user
  (
    '44444444-4444-4444-4444-444444444444',
    '00000000-0000-0000-0000-000000000000',
    'viewer@straysafe-test.com',
    crypt('password123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '',
    '',
    'authenticated',
    'authenticated'
  );

-- Insert corresponding profiles with roles
INSERT INTO profiles (
  id,
  email,
  full_name,
  role,
  is_active,
  created_at,
  updated_at
) VALUES
  -- Admin profile
  (
    '11111111-1111-1111-1111-111111111111',
    'admin@straysafe-test.com',
    'Admin Test User',
    'admin',
    true,
    NOW(),
    NOW()
  ),
  -- Volunteer profile
  (
    '22222222-2222-2222-2222-222222222222',
    'volunteer@straysafe-test.com',
    'Volunteer Test User',
    'volunteer',
    true,
    NOW(),
    NOW()
  ),
  -- Vet profile
  (
    '33333333-3333-3333-3333-333333333333',
    'vet@straysafe-test.com',
    'Veterinarian Test User',
    'vet',
    true,
    NOW(),
    NOW()
  ),
  -- Viewer profile
  (
    '44444444-4444-4444-4444-444444444444',
    'viewer@straysafe-test.com',
    'Viewer Test User',
    'viewer',
    true,
    NOW(),
    NOW()
  );

-- Create default privacy settings for test users
INSERT INTO user_privacy_settings (
  user_id,
  profile_visibility,
  location_sharing,
  activity_status,
  search_visibility,
  data_analytics
) VALUES
  ('11111111-1111-1111-1111-111111111111', true, true, true, true, true),
  ('22222222-2222-2222-2222-222222222222', true, true, true, true, true),
  ('33333333-3333-3333-3333-333333333333', true, false, true, true, false),
  ('44444444-4444-4444-4444-444444444444', false, false, false, false, false);

-- Create some test dogs for different scenarios
INSERT INTO dogs (
  id,
  name,
  status,
  gender,
  location_id,
  breed,
  age,
  description,
  is_neutered,
  is_vaccinated,
  created_by,
  created_at,
  updated_at
) VALUES
  (
    gen_random_uuid(),
    'Test Dog Alpha',
    'stray',
    'male',
    (SELECT id FROM locations LIMIT 1),
    'Mixed breed',
    2,
    'Test dog created by admin',
    false,
    false,
    '11111111-1111-1111-1111-111111111111',
    NOW(),
    NOW()
  ),
  (
    gen_random_uuid(),
    'Test Dog Beta',
    'fostered',
    'female',
    (SELECT id FROM locations LIMIT 1),
    'Thai Ridgeback',
    3,
    'Test dog created by volunteer',
    true,
    true,
    '22222222-2222-2222-2222-222222222222',
    NOW(),
    NOW()
  ),
  (
    gen_random_uuid(),
    'Test Dog Gamma',
    'adopted',
    'male',
    (SELECT id FROM locations LIMIT 1),
    'Golden Retriever',
    1,
    'Test dog with medical notes by vet',
    true,
    true,
    '33333333-3333-3333-3333-333333333333',
    NOW(),
    NOW()
  );

-- Print summary
SELECT 'Test users created successfully!' as status;
SELECT email, full_name, role FROM profiles WHERE email LIKE '%@straysafe-test.com' ORDER BY role;