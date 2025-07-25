import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './auth-store';
import { showToast } from '@/utils/toast';
import { 
  Conversation, 
  ConversationWithDetails,
  Message, 
  MessageWithUser 
} from '@/types';

export function useMessaging() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversationWithDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Fetch user's conversations
  const fetchConversations = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('conversations_with_details')
        .select('*')
        .order('last_message_at', { ascending: false, nullsFirst: false });

      if (error) throw error;

      // Transform data to match our types
      const transformedConversations: ConversationWithDetails[] = (data || []).map(item => ({
        id: item.id,
        participants: item.participants,
        lastMessage: item.last_message,
        lastMessageAt: item.last_message_at,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        otherParticipant: {
          id: item.other_participant.id,
          name: item.other_participant.name,
          avatar: item.other_participant.avatar,
          role: item.other_participant.role,
        },
        unreadCount: item.unread_count || 0,
      }));

      setConversations(transformedConversations);

    } catch (error) {
      console.error('Error fetching conversations:', error?.message || error);
      showToast('Failed to load conversations', 'error');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Start a new conversation with a user
  const startConversation = async (otherUserId: string): Promise<string | null> => {
    if (!user) {
      showToast('Please sign in to start a conversation', 'error');
      return null;
    }

    try {
      setSubmitting(true);

      // Use the database function to get or create conversation
      const { data, error } = await supabase.rpc('get_or_create_conversation', {
        user1_id: user.id,
        user2_id: otherUserId
      });

      if (error) throw error;

      await fetchConversations(); // Refresh conversations
      return data;

    } catch (error) {
      console.error('Error starting conversation:', error?.message || error);
      showToast('Failed to start conversation', 'error');
      return null;
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  return {
    conversations,
    loading,
    submitting,
    fetchConversations,
    startConversation,
  };
}

export function useConversation(conversationId: string) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<MessageWithUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Fetch messages for a conversation
  const fetchMessages = useCallback(async () => {
    if (!conversationId || !user) return;

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('messages_with_users')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Transform data to match our types
      const transformedMessages: MessageWithUser[] = (data || []).map(item => ({
        id: item.id,
        conversationId: item.conversation_id,
        senderId: item.sender_id,
        content: item.content,
        type: item.type,
        dogId: item.dog_id,
        isRead: item.is_read,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        sender: {
          id: item.sender.id,
          name: item.sender.name,
          avatar: item.sender.avatar,
          role: item.sender.role,
        },
      }));

      setMessages(transformedMessages);

      // Mark messages as read for current user
      await markMessagesAsRead();

    } catch (error) {
      console.error('Error fetching messages:', error?.message || error);
      showToast('Failed to load messages', 'error');
    } finally {
      setLoading(false);
    }
  }, [conversationId, user]);

  // Send a message
  const sendMessage = async (content: string, type: 'text' | 'dog_reference' = 'text', dogId?: string) => {
    if (!user || !conversationId) {
      showToast('Unable to send message', 'error');
      return false;
    }

    try {
      setSubmitting(true);

      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content,
          type,
          dog_id: dogId,
        });

      if (error) throw error;

      await fetchMessages(); // Refresh messages
      return true;

    } catch (error) {
      console.error('Error sending message:', error?.message || error);
      showToast('Failed to send message', 'error');
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  // Mark messages as read
  const markMessagesAsRead = async () => {
    if (!user || !conversationId) return;

    try {
      // Get unread messages from other users
      const unreadMessages = messages.filter(msg => 
        msg.senderId !== user.id && !msg.isRead
      );

      if (unreadMessages.length === 0) return;

      // Mark them as read
      const readStatuses = unreadMessages.map(msg => ({
        message_id: msg.id,
        user_id: user.id,
      }));

      const { error } = await supabase
        .from('message_read_status')
        .upsert(readStatuses, { 
          onConflict: 'message_id,user_id',
          ignoreDuplicates: true 
        });

      if (error) throw error;

    } catch (error) {
      console.error('Error marking messages as read:', error?.message || error);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Set up real-time subscription for new messages
  useEffect(() => {
    if (!conversationId) return;

    const subscription = supabase
      .channel(`conversation:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          // Refresh messages when new message is added
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [conversationId, fetchMessages]);

  return {
    messages,
    loading,
    submitting,
    sendMessage,
    fetchMessages,
    markMessagesAsRead,
  };
}