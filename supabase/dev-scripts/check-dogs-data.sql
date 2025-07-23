-- Check if dogs data exists in database
-- Run this in Supabase SQL Editor

-- Check if dogs table exists and has data
SELECT COUNT(*) as dog_count FROM dogs;

-- Show all dogs
SELECT id, name, status, gender, location_id, created_by FROM dogs;

-- Check users table
SELECT id, name, role FROM users;

-- Check locations
SELECT id, name FROM locations;