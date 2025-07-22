-- Helper functions for conversation creation

-- Function to create a private conversation between two users
CREATE OR REPLACE FUNCTION create_private_conversation(other_user_id UUID)
RETURNS UUID AS $$
DECLARE
    conversation_id UUID;
    current_user_id UUID;
BEGIN
    current_user_id := auth.uid();
    
    -- Check if conversation already exists between these two users
    SELECT c.id INTO conversation_id
    FROM conversations c
    WHERE c.type = 'private'
    AND EXISTS (
        SELECT 1 FROM conversation_participants cp1 
        WHERE cp1.conversation_id = c.id AND cp1.user_id = current_user_id
    )
    AND EXISTS (
        SELECT 1 FROM conversation_participants cp2 
        WHERE cp2.conversation_id = c.id AND cp2.user_id = other_user_id
    )
    AND (
        SELECT COUNT(*) FROM conversation_participants cp 
        WHERE cp.conversation_id = c.id
    ) = 2;
    
    -- If conversation exists, return it
    IF conversation_id IS NOT NULL THEN
        RETURN conversation_id;
    END IF;
    
    -- Create new conversation
    INSERT INTO conversations (type, created_by)
    VALUES ('private', current_user_id)
    RETURNING id INTO conversation_id;
    
    -- Add both participants
    INSERT INTO conversation_participants (conversation_id, user_id, role) VALUES
    (conversation_id, current_user_id, 'admin'),
    (conversation_id, other_user_id, 'member');
    
    RETURN conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create a dog discussion conversation
CREATE OR REPLACE FUNCTION create_dog_conversation(
    dog_id_param UUID,
    title_param TEXT,
    description_param TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    conversation_id UUID;
    current_user_id UUID;
BEGIN
    current_user_id := auth.uid();
    
    -- Create conversation
    INSERT INTO conversations (type, title, description, dog_id, created_by)
    VALUES ('dog_discussion', title_param, description_param, dog_id_param, current_user_id)
    RETURNING id INTO conversation_id;
    
    -- Add creator as admin
    INSERT INTO conversation_participants (conversation_id, user_id, role)
    VALUES (conversation_id, current_user_id, 'admin');
    
    RETURN conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to join a dog conversation
CREATE OR REPLACE FUNCTION join_dog_conversation(conversation_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
    current_user_id UUID;
    conv_type TEXT;
BEGIN
    current_user_id := auth.uid();
    
    -- Check if conversation exists and is a dog discussion
    SELECT type INTO conv_type
    FROM conversations
    WHERE id = conversation_id_param;
    
    IF conv_type != 'dog_discussion' THEN
        RETURN FALSE;
    END IF;
    
    -- Check if user is already a participant
    IF EXISTS (
        SELECT 1 FROM conversation_participants
        WHERE conversation_id = conversation_id_param AND user_id = current_user_id
    ) THEN
        RETURN TRUE;
    END IF;
    
    -- Add user as member
    INSERT INTO conversation_participants (conversation_id, user_id, role)
    VALUES (conversation_id_param, current_user_id, 'member');
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create a location group conversation
CREATE OR REPLACE FUNCTION create_location_conversation(
    location_id_param UUID,
    title_param TEXT,
    description_param TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    conversation_id UUID;
    current_user_id UUID;
BEGIN
    current_user_id := auth.uid();
    
    -- Create conversation
    INSERT INTO conversations (type, title, description, location_id, created_by)
    VALUES ('location_group', title_param, description_param, location_id_param, current_user_id)
    RETURNING id INTO conversation_id;
    
    -- Add creator as admin
    INSERT INTO conversation_participants (conversation_id, user_id, role)
    VALUES (conversation_id, current_user_id, 'admin');
    
    RETURN conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;