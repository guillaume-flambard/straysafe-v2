-- Create user_conversations view to show conversations with participant details
DROP VIEW IF EXISTS user_conversations;
CREATE VIEW user_conversations AS
SELECT 
    c.id,
    c.type,
    c.title,
    c.description,
    c.dog_id,
    c.location_id,
    c.created_by,
    c.is_active,
    c.last_message_at,
    c.created_at,
    c.updated_at,
    
    -- Creator info
    creator.email as creator_email,
    creator.full_name as creator_name,
    
    -- Dog info (if applicable)
    dogs.name as dog_name,
    
    -- Location info (if applicable)
    locations.name as location_name,
    
    -- Participant count
    (SELECT COUNT(*) FROM conversation_participants cp 
     WHERE cp.conversation_id = c.id AND cp.is_active = true) as participant_count,
     
    -- Last message info
    last_msg.content as last_message_content,
    last_sender.email as last_message_sender,
    
    -- Unread count for current user (if authenticated)
    CASE 
        WHEN auth.uid() IS NOT NULL THEN
            (SELECT COUNT(*) 
             FROM messages m
             WHERE m.conversation_id = c.id 
             AND m.created_at > COALESCE(
                 (SELECT last_read_at FROM conversation_participants 
                  WHERE conversation_id = c.id AND user_id = auth.uid()), 
                 c.created_at
             )
             AND m.sender_id != auth.uid())
        ELSE 0
    END as unread_count

FROM conversations c
LEFT JOIN profiles creator ON c.created_by = creator.id
LEFT JOIN dogs ON c.dog_id = dogs.id
LEFT JOIN locations ON c.location_id = locations.id
LEFT JOIN messages last_msg ON c.last_message_id = last_msg.id
LEFT JOIN profiles last_sender ON last_msg.sender_id = last_sender.id
WHERE c.is_active = true
ORDER BY c.last_message_at DESC NULLS LAST, c.created_at DESC;