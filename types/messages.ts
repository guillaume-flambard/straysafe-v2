export type ConversationType = 'private' | 'dog_discussion' | 'location_group';
export type MessageType = 'text' | 'image' | 'location' | 'system';
export type UserStatus = 'online' | 'away' | 'busy' | 'offline';
export type ParticipantRole = 'admin' | 'moderator' | 'member';

export interface Conversation {
  id: string;
  type: ConversationType;
  title?: string;
  description?: string;
  dog_id?: string;
  location_id?: string;
  created_by: string;
  is_active: boolean;
  last_message_at: string;
  created_at: string;
  updated_at: string;
  
  // Legacy fields (for compatibility)
  participant_1_id?: string;
  participant_2_id?: string;
  last_message_id?: string;
}

export interface ConversationParticipant {
  id: string;
  conversation_id: string;
  user_id: string;
  role: ParticipantRole;
  joined_at: string;
  last_read_at: string;
  is_active: boolean;
  notifications_enabled: boolean;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: MessageType;
  image_url?: string;
  metadata?: Record<string, any>;
  reply_to_id?: string;
  is_edited: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  
  // Legacy fields (for compatibility)
  recipient_id?: string;
  dog_id?: string;
  is_read?: boolean;
}

export interface MessageReaction {
  id: string;
  message_id: string;
  user_id: string;
  reaction: string;
  created_at: string;
}

export interface UserPresence {
  user_id: string;
  status: UserStatus;
  last_seen: string;
  current_conversation_id?: string;
  updated_at: string;
}

// Extended types with relations
export interface ConversationWithDetails extends Conversation {
  creator_email?: string;
  creator_name?: string;
  dog_name?: string;
  location_name?: string;
  participant_count?: number;
  other_participant_name?: string;
  other_participant_email?: string;
  last_message_content?: string;
  last_message_sender?: string;
  participants?: ConversationParticipant[];
  unread_count?: number;
}

export interface MessageWithUser extends Message {
  sender_email?: string;
  reply_content?: string;
  reply_sender_email?: string;
  reactions?: MessageReaction[];
}

// Hooks return types
export interface ConversationsState {
  conversations: ConversationWithDetails[];
  loading: boolean;
  error: string | null;
}

export interface MessagesState {
  messages: MessageWithUser[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
}

export interface PresenceState {
  users: Record<string, UserPresence>;
  loading: boolean;
  error: string | null;
}

// Function parameters
export interface CreateConversationParams {
  type: ConversationType;
  title?: string;
  description?: string;
  dog_id?: string;
  location_id?: string;
  participant_ids?: string[];
}

export interface SendMessageParams {
  conversation_id: string;
  content: string;
  message_type?: MessageType;
  image_url?: string;
  metadata?: Record<string, any>;
  reply_to_id?: string;
}