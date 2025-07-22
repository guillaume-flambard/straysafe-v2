-- Function to ensure the current authenticated user has a profile
-- Run this if you need to manually create your profile for testing

INSERT INTO profiles (id, email, full_name, role)
SELECT 
    auth.uid() as id,
    (SELECT email FROM auth.users WHERE id = auth.uid()) as email,
    COALESCE(
        (SELECT raw_user_meta_data->>'full_name' FROM auth.users WHERE id = auth.uid()),
        (SELECT email FROM auth.users WHERE id = auth.uid())
    ) as full_name,
    'admin' as role
WHERE auth.uid() IS NOT NULL
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(profiles.full_name, EXCLUDED.full_name),
    updated_at = NOW();