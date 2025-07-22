-- Create messages_with_user view to show messages with sender information
DROP VIEW IF EXISTS messages_with_user;
CREATE VIEW messages_with_user AS
SELECT 
    m.id,
    m.conversation_id,
    m.sender_id,
    m.content,
    m.message_type,
    m.image_url,
    m.metadata,
    m.reply_to_id,
    m.is_edited,
    m.is_deleted,
    m.created_at,
    m.updated_at,
    
    -- Sender info
    sender.email as sender_email,
    sender.full_name as sender_name,
    sender.avatar_url as sender_avatar,
    
    -- Reply info (if it's a reply)
    reply_msg.content as reply_content,
    reply_sender.email as reply_sender_email,
    reply_sender.full_name as reply_sender_name

FROM messages m
LEFT JOIN profiles sender ON m.sender_id = sender.id
LEFT JOIN messages reply_msg ON m.reply_to_id = reply_msg.id
LEFT JOIN profiles reply_sender ON reply_msg.sender_id = reply_sender.id
WHERE m.is_deleted = false
ORDER BY m.created_at ASC;