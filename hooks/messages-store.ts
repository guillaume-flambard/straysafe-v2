import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './auth-store';
import { showToast } from '@/utils/toast';
import { sendMessageNotification } from '@/utils/notifications';
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
  
  // Track fallback timeouts to cancel them if subscription works
  const fallbackTimeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

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
      } else if (params.type === 'location_group' && params.location_id) {
        // Use helper function for location groups
        const { data, error } = await supabase.rpc(
          'create_location_conversation',
          {
            location_id_param: params.location_id,
            title_param: params.title || `Location Group`,
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
      
      const newMessages = (data || []).reverse(); // Reverse to show oldest first
      
      setMessagesState(prev => {
        // Smart merge: only add truly new messages to prevent unnecessary re-renders
        if (offset === 0) {
          const existingIds = new Set(prev.messages.map(m => m.id));
          const trulyNewMessages = newMessages.filter(m => !existingIds.has(m.id));
          
          if (trulyNewMessages.length === 0) {
            // No new messages, keep existing state to avoid re-render
            return { ...prev, loading: false, error: null };
          }
          
          // Merge existing messages with new ones, maintaining order
          const mergedMessages = [...prev.messages, ...trulyNewMessages]
            .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
          
          return {
            messages: mergedMessages,
            loading: false,
            error: null,
            hasMore: data ? data.length === limit : false
          };
        } else {
          // Normal pagination logic
          return {
            messages: [...newMessages, ...prev.messages],
            loading: false,
            error: null,
            hasMore: data ? data.length === limit : false
          };
        }
      });
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
      console.log('Sending message:', { 
        conversation_id: params.conversation_id,
        sender_id: user.id,
        content: params.content,
        currentConversationId
      });

      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: params.conversation_id,
          sender_id: user.id,
          content: params.content,
          message_type: params.message_type || 'text',
          image_url: params.image_url,
          metadata: params.metadata,
          reply_to_id: params.reply_to_id
        })
        .select()
        .single();
      
      if (error) throw error;
      
      console.log('Message sent successfully:', data);
      
      // Primary: Let the real-time subscription handle the update
      // Fallback: If subscription doesn't work within 100ms, refresh manually
      if (params.conversation_id === currentConversationId) {
        const timeoutId = setTimeout(async () => {
          console.log('🔄 Fallback refresh after 100ms - subscription may have failed');
          await fetchMessages(params.conversation_id, 0);
          fallbackTimeoutsRef.current.delete(data.id);
        }, 100);
        
        // Store timeout so subscription can cancel it if it works
        fallbackTimeoutsRef.current.set(data.id, timeoutId);
      }
      
      // Send push notifications to other conversation participants
      await sendNotificationsForMessage(params.conversation_id, params.content);
      
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      showToast('Failed to send message', 'error');
      return false;
    }
  };

  const sendNotificationsForMessage = async (conversationId: string, messageContent: string) => {
    if (!user) return;

    try {
      // Get conversation details
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .single();

      if (convError) throw convError;

      // Get participant user IDs (excluding sender) using separate queries
      const { data: participantRows, error: partError } = await supabase
        .from('conversation_participants')
        .select('user_id')
        .eq('conversation_id', conversationId)
        .neq('user_id', user.id)
        .eq('is_active', true);

      if (partError) throw partError;
      if (!participantRows || participantRows.length === 0) return;

      const recipientUserIds = participantRows.map(p => p.user_id);
      const senderName = user.user_metadata?.full_name || user.email || 'Someone';
      
      // Send notification (simplified - just log for now since push notifications need production build)
      console.log(`📱 Would send notification to ${recipientUserIds.length} users:`, {
        conversationId,
        senderId: user.id,
        senderName,
        message: messageContent.substring(0, 50) + (messageContent.length > 50 ? '...' : ''),
        recipientUserIds,
        conversationTitle: conversation?.title,
      });

      // Uncomment for actual push notifications in production:
      // await sendMessageNotification({
      //   conversationId,
      //   senderId: user.id,
      //   senderName,
      //   message: messageContent,
      //   recipientUserIds,
      //   conversationTitle: conversation?.title,
      // });

    } catch (error) {
      console.error('Error sending message notifications:', error);
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
    // Skip presence updates for now in development
    console.log(`👤 User presence: ${status}${conversationId ? ` in ${conversationId}` : ''}`);
  };

  const fetchPresence = useCallback(async () => {
    // Skip presence fetching for now in development
    setPresenceState({
      users: {},
      loading: false,
      error: null
    });
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

    // Subscription to messages changes - simplified approach
    const messagesSubscription = supabase
      .channel('messages_changes')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          console.log('📨 SUBSCRIPTION: New message received:', {
            id: payload.new.id,
            conversation_id: payload.new.conversation_id,
            sender_id: payload.new.sender_id,
            content: payload.new.content,
            currentConversationId
          });
          
          // Cancel fallback timeout since subscription worked
          const timeoutId = fallbackTimeoutsRef.current.get(payload.new.id);
          if (timeoutId) {
            console.log('⏰ Canceling fallback timeout - subscription worked');
            clearTimeout(timeoutId);
            fallbackTimeoutsRef.current.delete(payload.new.id);
          }
          
          if (payload.new.conversation_id === currentConversationId && currentConversationId) {
            console.log('✅ SUBSCRIPTION: Refreshing current conversation messages');
            // Simple refresh without debouncing for more predictable behavior
            fetchMessages(currentConversationId, 0);
          } else {
            console.log('❌ SUBSCRIPTION: Not refreshing (different conversation or no current conversation)');
          }
          // Refresh conversations list to update last message
          fetchConversations();
        }
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages' },
        (payload) => {
          console.log('📝 SUBSCRIPTION: Message updated:', payload.new);
          if (payload.new.conversation_id === currentConversationId && currentConversationId) {
            fetchMessages(currentConversationId, 0);
          }
          fetchConversations();
        }
      )
      .subscribe((status) => {
        console.log('🔌 SUBSCRIPTION STATUS:', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ Messages subscription is active');
        } else if (status === 'CHANNEL_ERROR') {
          console.log('❌ Messages subscription failed');
        }
      });

    // Skip presence subscription for development
    // const presenceSubscription = supabase
    //   .channel('presence_changes')
    //   .on('postgres_changes',
    //     { event: '*', schema: 'public', table: 'user_presence' },
    //     () => fetchPresence()
    //   )
    //   .subscribe();

    // Set user offline when component unmounts
    return () => {
      updatePresence('offline');
      conversationsSubscription.unsubscribe();
      messagesSubscription.unsubscribe();
      
      // Clear any pending fallback timeouts
      fallbackTimeoutsRef.current.forEach((timeoutId) => {
        clearTimeout(timeoutId);
      });
      fallbackTimeoutsRef.current.clear();
      
      // presenceSubscription.unsubscribe();
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