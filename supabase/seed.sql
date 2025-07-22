-- Insert sample users first (required for created_by foreign keys)
INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, 
  invited_at, confirmation_token, confirmation_sent_at, recovery_token, 
  recovery_sent_at, email_change_token_new, email_change, email_change_sent_at, 
  last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, 
  created_at, updated_at, phone, phone_confirmed_at, phone_change, 
  phone_change_token, phone_change_sent_at, email_change_token_current, 
  email_change_confirm_status, banned_until, reauthentication_token, 
  reauthentication_sent_at, is_sso_user, deleted_at
) VALUES (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'authenticated',
  'authenticated',
  'admin@straysafe.org',
  crypt('password', gen_salt('bf')),
  NOW(),
  NULL,
  '',
  NULL,
  '',
  NULL,
  '',
  '',
  NULL,
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Admin User","role":"admin"}',
  false,
  NOW(),
  NOW(),
  NULL,
  NULL,
  '',
  '',
  NULL,
  '',
  0,
  NULL,
  '',
  NULL,
  false,
  NULL
);

-- User profile will be automatically created by the handle_new_user() trigger
-- Update the user role to admin (default is 'viewer')
UPDATE users SET role = 'admin' WHERE id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

-- Insert sample dogs for testing
INSERT INTO dogs (
  id, name, status, gender, location_id, breed, age, description, 
  last_seen, last_seen_location, medical_notes, is_neutered, is_vaccinated, 
  main_image, created_by
) VALUES
(
  '550e8400-e29b-41d4-a716-446655440101',
  'Max',
  'stray',
  'male',
  '550e8400-e29b-41d4-a716-446655440001',
  'Mixed',
  3,
  'Friendly dog often seen near the beach. Responds to food and gentle approach.',
  '2025-07-20T14:30:00.000Z',
  'Thong Sala Market',
  'Appears healthy but has a slight limp in right hind leg.',
  false,
  false,
  'https://images.unsplash.com/photo-1543466835-00a7907e9de1?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
),
(
  '550e8400-e29b-41d4-a716-446655440102',
  'Luna',
  'fostered',
  'female',
  '550e8400-e29b-41d4-a716-446655440001',
  'Thai Ridgeback Mix',
  2,
  'Sweet and gentle. Good with other dogs and children.',
  NULL,
  NULL,
  'Recovered from minor skin infection. On regular flea treatment.',
  true,
  true,
  'https://images.unsplash.com/photo-1518717758536-85ae29035b6d?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
),
(
  '550e8400-e29b-41d4-a716-446655440103',
  'Rocky',
  'stray',
  'male',
  '550e8400-e29b-41d4-a716-446655440001',
  'Unknown',
  5,
  'Cautious but not aggressive. Has distinctive white patch on chest.',
  '2025-07-21T09:15:00.000Z',
  'Near 7-Eleven in Baan Tai',
  NULL,
  false,
  false,
  'https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
),
(
  '550e8400-e29b-41d4-a716-446655440104',
  'Bella',
  'adopted',
  'female',
  '550e8400-e29b-41d4-a716-446655440001',
  'Thai Mix',
  1,
  'Playful and energetic. Loves to chase balls.',
  NULL,
  NULL,
  'Fully vaccinated and in excellent health.',
  true,
  true,
  'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
),
(
  '550e8400-e29b-41d4-a716-446655440105',
  'Charlie',
  'stray',
  'male',
  '550e8400-e29b-41d4-a716-446655440001',
  'Unknown',
  NULL,
  'Shy dog, runs away when approached directly.',
  '2025-07-19T17:20:00.000Z',
  'Srithanu area',
  NULL,
  false,
  false,
  'https://images.unsplash.com/photo-1477884213360-7e9d7dcc1e48?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
);

-- Insert sample events
INSERT INTO events (dog_id, type, title, description, date, created_by, is_private) VALUES
(
  '550e8400-e29b-41d4-a716-446655440101',
  'location',
  'Spotted at Thong Sala Market',
  'Seen scavenging for food near the food stalls.',
  '2025-07-20T14:30:00.000Z',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  false
),
(
  '550e8400-e29b-41d4-a716-446655440101',
  'medical',
  'Observed limping',
  'Dog has a noticeable limp in right hind leg. Does not appear to be in severe pain.',
  '2025-07-20T14:35:00.000Z',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  false
),
(
  '550e8400-e29b-41d4-a716-446655440102',
  'status',
  'Moved to foster home',
  'Luna has been placed in a foster home with Jane Smith.',
  '2025-06-15T09:00:00.000Z',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  false
),
(
  '550e8400-e29b-41d4-a716-446655440102',
  'medical',
  'Vaccination completed',
  'Received core vaccines including rabies, distemper, and parvovirus.',
  '2025-06-20T11:30:00.000Z',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  false
),
(
  '550e8400-e29b-41d4-a716-446655440102',
  'medical',
  'Spaying procedure',
  'Successfully spayed. Recovery normal with no complications.',
  '2025-07-05T10:00:00.000Z',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  false
);