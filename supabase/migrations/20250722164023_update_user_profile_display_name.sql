-- Update current user profiles to have proper display names instead of just emails
-- This will improve message display to show names instead of email addresses

UPDATE profiles 
SET full_name = CASE 
    WHEN full_name IS NULL OR full_name = email THEN 
        CASE 
            WHEN email = 'g.flambard@gmail.com' THEN 'Guillaume Flambard'
            ELSE INITCAP(SPLIT_PART(email, '@', 1))
        END
    ELSE full_name
END
WHERE full_name IS NULL OR full_name = email;

-- Also update user metadata in auth.users if needed
-- This helps with consistent display across the app