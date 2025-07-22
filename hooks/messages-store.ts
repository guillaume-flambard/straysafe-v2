import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './auth-store';
import { showToast } from '@/utils/toast';
import type { 
  Conversation,
  ConversationWithDetails,
  Message,
  MessageWithUser,
  ConversationsState,
  MessagesState,
  PresenceState,
  CreateConversationParams,
  SendMessageParams,
  UserPresence
} from '@/types/messages';

export function useMessages() {
  const { user } = useAuth();
  
  // States
  const [conversationsState, setConversationsState] = useState<ConversationsState>({
    conversations: [],
    loading: true,
    error: null
  });
  
  const [messagesState, setMessagesState] = useState<MessagesState>({
    messages: [],
    loading: false,
    error: null,
    hasMore: true
  });
  
  const [presenceState, setPresenceState] = useState<PresenceState>({
    users: {},
    loading: false,
    error: null
  });
  
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);

  // ====================================
  // CONVERSATIONS
  // ====================================
  
  const fetchConversations = useCallback(async () => {
    if (!user) return;
    
    try {
      setConversationsState(prev => ({ ...prev, loading: true, error: null }));
      
      const { data, error } = await supabase
        .from('user_conversations')
        .select(`
          *,
          dog_name:dogs(name),
          location_name:locations(name)
        `)
        .order('last_message_at', { ascending: false });
      
      if (error) throw error;
      
      setConversationsState({
        conversations: data || [],
        loading: false,
        error: null
      });
    } catch (error) {
      console.error('Error fetching conversations:', error);
      setConversationsState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load conversations'
      }));
    }
  }, [user]);

  const createConversation = async (params: CreateConversationParams): Promise<string | null> => {
    if (!user) {
      showToast('You must be logged in to create conversations', 'error');
      return null;
    }

    try {
      let conversationId: string;

      if (params.type === 'private' && params.participant_ids?.[0]) {
        // Use helper function for private conversations
        const { data, error } = await supabase.rpc(
          'create_private_conversation', 
          { other_user_id: params.participant_ids[0] }
        );
        
        if (error) throw error;
        conversationId = data;
      } else if (params.type === 'dog_discussion' && params.dog_id) {
        // Use helper function for dog discussions
        const { data, error } = await supabase.rpc(
          'create_dog_conversation', 
          { 
            dog_id_param: params.dog_id,
            title_param: params.title || `Discussion about dog`,
            description_param: params.description
          }
        );
        
        if (error) throw error;
        conversationId = data;
      } else {
        // Manual creation for other types
        const { data, error } = await supabase
          .from('conversations')
          .insert({
            type: params.type,
            title: params.title,
            description: params.description,
            dog_id: params.dog_id,
            location_id: params.location_id,
            created_by: user.id
          })
          .select()
          .single();
        
        if (error) throw error;
        conversationId = data.id;

        // Add participants
        if (params.participant_ids && params.participant_ids.length > 0) {
          const participants = params.participant_ids.map(userId => ({
            conversation_id: conversationId,
            user_id: userId,
            role: userId === user.id ? 'admin' : 'member'
          }));

          const { error: participantsError } = await supabase
            .from('conversation_participants')
            .insert(participants);
          
          if (participantsError) throw participantsError;
        }
      }

      showToast('Conversation created successfully! 💬', 'success');
      await fetchConversations();
      return conversationId;
    } catch (error) {
      console.error('Error creating conversation:', error);
      showToast('Failed to create conversation', 'error');
      return null;
    }
  };

  const joinConversation = async (conversationId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data, error } = await supabase.rpc(
        'join_dog_conversation',
        { conversation_id_param: conversationId }
      );
      
      if (error) throw error;
      
      if (data) {
        showToast('Joined conversation! 🎉', 'success');
        await fetchConversations();
      }
      
      return data;
    } catch (error) {
      console.error('Error joining conversation:', error);
      showToast('Failed to join conversation', 'error');
      return false;
    }
  };

  // ====================================
  // MESSAGES
  // ====================================
  
  const fetchMessages = useCallback(async (conversationId: string, offset = 0, limit = 50) => {
    try {
      if (offset === 0) {
        setMessagesState(prev => ({ ...prev, loading: true, error: null }));
      }
      
      const { data, error } = await supabase
        .from('messages_with_user')
        .select('*')
        .eq('conversation_id', conversationId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      
      if (error) throw error;
      
      const messages = (data || []).reverse(); // Reverse to show oldest first
      
      setMessagesState(prev => ({
        messages: offset === 0 ? messages : [...messages, ...prev.messages],
        loading: false,
        error: null,
        hasMore: data ? data.length === limit : false
      }));
    } catch (error) {
      console.error('Error fetching messages:', error);
      setMessagesState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load messages'
      }));
    }
  }, []);

  const sendMessage = async (params: SendMessageParams): Promise<boolean> => {
    if (!user) {
      showToast('You must be logged in to send messages', 'error');
      return false;
    }

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: params.conversation_id,
          sender_id: user.id,
          content: params.content,
          message_type: params.message_type || 'text',
          image_url: params.image_url,
          metadata: params.metadata,
          reply_to_id: params.reply_to_id
        });
      
      if (error) throw error;
      
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      showToast('Failed to send message', 'error');
      return false;
    }
  };

  const markAsRead = async (conversationId: string) => {
    if (!user) return;

    try {
      await supabase
        .from('conversation_participants')
        .update({ last_read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .eq('user_id', user.id);
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  // ====================================
  // PRESENCE
  // ====================================
  
  const updatePresence = async (status: 'online' | 'away' | 'busy' | 'offline', conversationId?: string) => {
    if (!user) return;

    try {
      await supabase.rpc('update_user_presence', {
        status_param: status,
        conversation_id_param: conversationId
      });
    } catch (error) {
      console.error('Error updating presence:', error);
    }
  };

  const fetchPresence = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('user_presence')
        .select('*');
      
      if (error) throw error;
      
      const presenceMap = (data || []).reduce((acc, presence) => {
        acc[presence.user_id] = presence;
        return acc;
      }, {} as Record<string, UserPresence>);
      
      setPresenceState({
        users: presenceMap,
        loading: false,
        error: null
      });
    } catch (error) {
      console.error('Error fetching presence:', error);
      setPresenceState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load presence'
      }));
    }
  }, []);

  // ====================================
  // REAL-TIME SUBSCRIPTIONS
  // ====================================
  
  useEffect(() => {
    if (!user) return;

    // Set user online when component mounts
    updatePresence('online');

    // Subscription to conversations changes
    const conversationsSubscription = supabase
      .channel('conversations_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'conversations' },
        () => fetchConversations()
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'conversation_participants' },
        () => fetchConversations()
      )
      .subscribe();

    // Subscription to messages changes
    const messagesSubscription = supabase
      .channel('messages_changes')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          if (payload.new.conversation_id === currentConversationId) {
            // Refresh messages for current conversation
            fetchMessages(currentConversationId, 0);
          }
          // Also refresh conversations list to update last message
          fetchConversations();
        }
      )
      .subscribe();

    // Subscription to presence changes
    const presenceSubscription = supabase
      .channel('presence_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'user_presence' },
        () => fetchPresence()
      )
      .subscribe();

    // Set user offline when component unmounts
    return () => {
      updatePresence('offline');
      conversationsSubscription.unsubscribe();
      messagesSubscription.unsubscribe();
      presenceSubscription.unsubscribe();
    };
  }, [user, currentConversationId, fetchConversations, fetchMessages, fetchPresence]);

  // Initial load
  useEffect(() => {
    if (user) {
      fetchConversations();
      fetchPresence();
    }
  }, [user, fetchConversations, fetchPresence]);

  return {
    // States
    conversations: conversationsState.conversations,
    conversationsLoading: conversationsState.loading,
    conversationsError: conversationsState.error,
    
    messages: messagesState.messages,
    messagesLoading: messagesState.loading,
    messagesError: messagesState.error,
    messagesHasMore: messagesState.hasMore,
    
    presenceUsers: presenceState.users,
    presenceLoading: presenceState.loading,
    presenceError: presenceState.error,
    
    currentConversationId,
    
    // Actions
    fetchConversations,
    createConversation,
    joinConversation,
    
    fetchMessages,
    sendMessage,
    markAsRead,
    
    updatePresence,
    setCurrentConversationId,
    
    // Utils
    getUserPresence: (userId: string) => presenceState.users[userId] || null,
    isUserOnline: (userId: string) => presenceState.users[userId]?.status === 'online',
  };
}