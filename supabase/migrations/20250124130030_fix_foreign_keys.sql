-- Fix Foreign Keys for Dog Interactions
-- Created: 2025-01-24 13:00:30

-- First, let's check if the foreign key constraints exist and drop them if needed
DO $$
BEGIN
    -- Drop foreign key constraints if they exist
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'dog_interests_user_id_fkey' 
               AND table_name = 'dog_interests') THEN
        ALTER TABLE dog_interests DROP CONSTRAINT dog_interests_user_id_fkey;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'dog_comments_user_id_fkey' 
               AND table_name = 'dog_comments') THEN
        ALTER TABLE dog_comments DROP CONSTRAINT dog_comments_user_id_fkey;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'dog_following_user_id_fkey' 
               AND table_name = 'dog_following') THEN
        ALTER TABLE dog_following DROP CONSTRAINT dog_following_user_id_fkey;
    END IF;
END
$$;

-- Add correct foreign key constraints referencing profiles table
ALTER TABLE dog_interests ADD CONSTRAINT dog_interests_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE dog_comments ADD CONSTRAINT dog_comments_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE dog_following ADD CONSTRAINT dog_following_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Recreate helper views if they don't exist
CREATE OR REPLACE VIEW dog_interests_with_users AS
SELECT 
  di.*,
  p.full_name as user_name,
  p.email as user_email,
  p.avatar_url as user_avatar,
  p.role as user_role
FROM dog_interests di
JOIN profiles p ON di.user_id = p.id
WHERE di.status != 'withdrawn';

CREATE OR REPLACE VIEW dog_comments_with_users AS
SELECT 
  dc.*,
  p.full_name as user_name,
  p.avatar_url as user_avatar,
  p.role as user_role,
  (SELECT COUNT(*) FROM dog_comments replies WHERE replies.parent_id = dc.id AND replies.is_deleted = false) as reply_count
FROM dog_comments dc
JOIN profiles p ON dc.user_id = p.id
WHERE dc.is_deleted = false;

CREATE OR REPLACE VIEW dog_interaction_stats AS
SELECT 
  d.id as dog_id,
  d.name as dog_name,
  COALESCE(interests.adoption_count, 0) as adoption_interests,
  COALESCE(interests.fostering_count, 0) as fostering_interests,
  COALESCE(interests.sponsoring_count, 0) as sponsoring_interests,
  COALESCE(interests.total_interests, 0) as total_interests,
  COALESCE(comments.comment_count, 0) as comment_count,
  COALESCE(followers.follower_count, 0) as follower_count
FROM dogs d
LEFT JOIN (
  SELECT 
    dog_id,
    COUNT(CASE WHEN type = 'adoption' AND status = 'pending' THEN 1 END) as adoption_count,
    COUNT(CASE WHEN type = 'fostering' AND status = 'pending' THEN 1 END) as fostering_count,
    COUNT(CASE WHEN type = 'sponsoring' AND status = 'pending' THEN 1 END) as sponsoring_count,
    COUNT(*) as total_interests
  FROM dog_interests 
  WHERE status = 'pending'
  GROUP BY dog_id
) interests ON d.id = interests.dog_id
LEFT JOIN (
  SELECT 
    dog_id,
    COUNT(*) as comment_count
  FROM dog_comments 
  WHERE is_deleted = false
  GROUP BY dog_id
) comments ON d.id = comments.dog_id
LEFT JOIN (
  SELECT 
    dog_id,
    COUNT(*) as follower_count
  FROM dog_following
  GROUP BY dog_id
) followers ON d.id = followers.dog_id;

-- Grant permissions on views
GRANT SELECT ON dog_interests_with_users TO authenticated;
GRANT SELECT ON dog_comments_with_users TO authenticated;
GRANT SELECT ON dog_interaction_stats TO authenticated;