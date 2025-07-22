-- Insert sample dogs data
-- Run this in Supabase SQL Editor after creating a user profile

-- First, get a user ID to use as created_by
-- You can replace this with your actual user ID
-- SELECT id FROM users LIMIT 1;

-- Insert sample dogs (replace 'your-user-id' with an actual user ID from users table)
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
  (SELECT id FROM users LIMIT 1)
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
  (SELECT id FROM users LIMIT 1)
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
  (SELECT id FROM users LIMIT 1)
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
  (SELECT id FROM users LIMIT 1)
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
  (SELECT id FROM users LIMIT 1)
);

-- Insert sample events
INSERT INTO events (dog_id, type, title, description, date, created_by, is_private) VALUES
(
  '550e8400-e29b-41d4-a716-446655440101',
  'location',
  'Spotted at Thong Sala Market',
  'Seen scavenging for food near the food stalls.',
  '2025-07-20T14:30:00.000Z',
  (SELECT id FROM users LIMIT 1),
  false
),
(
  '550e8400-e29b-41d4-a716-446655440101',
  'medical',
  'Observed limping',
  'Dog has a noticeable limp in right hind leg. Does not appear to be in severe pain.',
  '2025-07-20T14:35:00.000Z',
  (SELECT id FROM users LIMIT 1),
  false
),
(
  '550e8400-e29b-41d4-a716-446655440102',
  'status',
  'Moved to foster home',
  'Luna has been placed in a foster home with Jane Smith.',
  '2025-06-15T09:00:00.000Z',
  (SELECT id FROM users LIMIT 1),
  false
);