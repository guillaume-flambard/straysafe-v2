-- Create dog interaction stats view
-- Created: 2025-01-25 18:00:00

-- Create a view that aggregates interaction statistics for each dog
CREATE OR REPLACE VIEW dog_interaction_stats AS
SELECT 
  d.id as dog_id,
  -- Interest counts by type
  COALESCE(adoption_count.count, 0) as adoption_count,
  COALESCE(fostering_count.count, 0) as fostering_count,
  COALESCE(sponsoring_count.count, 0) as sponsoring_count,
  COALESCE(volunteering_count.count, 0) as volunteering_count,
  -- Total interests
  COALESCE(adoption_count.count, 0) + 
  COALESCE(fostering_count.count, 0) + 
  COALESCE(sponsoring_count.count, 0) + 
  COALESCE(volunteering_count.count, 0) as total_interests,
  -- Comment count
  COALESCE(comment_count.count, 0) as comment_count,
  -- Following count
  COALESCE(following_count.count, 0) as following_count
FROM dogs d
LEFT JOIN (
  SELECT dog_id, COUNT(*) as count 
  FROM dog_interests 
  WHERE type = 'adoption' AND status != 'withdrawn'
  GROUP BY dog_id
) adoption_count ON d.id = adoption_count.dog_id
LEFT JOIN (
  SELECT dog_id, COUNT(*) as count 
  FROM dog_interests 
  WHERE type = 'fostering' AND status != 'withdrawn'
  GROUP BY dog_id
) fostering_count ON d.id = fostering_count.dog_id
LEFT JOIN (
  SELECT dog_id, COUNT(*) as count 
  FROM dog_interests 
  WHERE type = 'sponsoring' AND status != 'withdrawn'
  GROUP BY dog_id
) sponsoring_count ON d.id = sponsoring_count.dog_id
LEFT JOIN (
  SELECT dog_id, COUNT(*) as count 
  FROM dog_interests 
  WHERE type = 'volunteering' AND status != 'withdrawn'
  GROUP BY dog_id
) volunteering_count ON d.id = volunteering_count.dog_id
LEFT JOIN (
  SELECT dog_id, COUNT(*) as count 
  FROM dog_comments 
  WHERE is_deleted = false
  GROUP BY dog_id
) comment_count ON d.id = comment_count.dog_id
LEFT JOIN (
  SELECT dog_id, COUNT(*) as count 
  FROM dog_following 
  GROUP BY dog_id
) following_count ON d.id = following_count.dog_id;

-- Grant permissions
GRANT SELECT ON dog_interaction_stats TO authenticated;