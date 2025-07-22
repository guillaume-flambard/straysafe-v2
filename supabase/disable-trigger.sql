-- Temporarily disable the problematic trigger
-- Run this in Supabase SQL Editor

-- Drop the trigger that's causing the error
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop the function as well
DROP FUNCTION IF EXISTS public.handle_new_user();