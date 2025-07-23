import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Image,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMessages } from '@/hooks/messages-store';
import { useAuth } from '@/hooks/auth-store';
import Colors from '@/constants/colors';
import Input from '@/components/Input';
import Button from '@/components/Button';
import { showToast, ToastComponent } from '@/utils/toast';
import * as ImagePicker from 'expo-image-picker';

export default function ChatScreen() {
  const router = useRouter();
  const { id: conversationId } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const {
    messages,
    messagesLoading,
    messagesError,
    conversations,
    fetchMessages,
    sendMessage,
    markAsRead,
    setCurrentConversationId,
    presenceUsers,
    isUserOnline,
    updatePresence
  } = useMessages();

  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Get current conversation
  const conversation = conversations.find(c => c.id === conversationId);

  useEffect(() => {
    if (conversationId && user) {
      setCurrentConversationId(conversationId);
      fetchMessages(conversationId);
      markAsRead(conversationId);
      updatePresence('online', conversationId);

      return () => {
        setCurrentConversationId(null);
        updatePresence('online');
      };
    }
  }, [conversationId, user]);

  useEffect(() => {
    // Auto scroll to bottom when new messages arrive
    setTimeout(() => {
      if (messages.length > 0) {
        flatListRef.current?.scrollToEnd({ animated: true });
      }
    }, 100);
  }, [messages.length]);

  const handleSendMessage = async () => {
    if (!messageText.trim() || !conversationId || sending) return;

    const tempMessage = messageText.trim();
    setMessageText('');
    setSending(true);

    const success = await sendMessage({
      conversation_id: conversationId,
      content: tempMessage,
    });

    if (!success) {
      setMessageText(tempMessage); // Restore message on error
    }

    setSending(false);
  };

  const handleSendImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showToast('Permission needed to access photos', 'warning');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSending(true);
        // TODO: Implement image upload to Supabase Storage
        // For now, just send the local URI
        const success = await sendMessage({
          conversation_id: conversationId!,
          content: 'Image sent',
          message_type: 'image',
          image_url: result.assets[0].uri,
        });

        if (success) {
          showToast('Image sent! 📸', 'success');
        }
        setSending(false);
      }
    } catch (error) {
      showToast('Failed to send image', 'error');
      setSending(false);
    }
  };

  const getConversationTitle = () => {
    if (!conversation) return 'Chat';
    if (conversation.title) return conversation.title;
    if (conversation.dog_name) return `Discussion: ${conversation.dog_name}`;
    if (conversation.location_name) return conversation.location_name;
    
    // For private chats, show the other participant's name
    if (conversation.type === 'private') {
      const otherParticipant = conversation.other_participant_name || conversation.other_participant_email;
      if (otherParticipant) {
        return otherParticipant;
      }
    }
    
    return 'Private Chat';
  };

  const getConversationSubtitle = () => {
    if (!conversation) return '';
    
    const parts = [];
    if (conversation.participant_count) {
      parts.push(`${conversation.participant_count} participants`);
    }
    if (conversation.dog_name && conversation.type !== 'dog_discussion') {
      parts.push(`About: ${conversation.dog_name}`);
    }
    return parts.join(' • ');
  };

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatMessageDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('fr-FR', { 
        weekday: 'long',
        month: 'long',
        day: 'numeric'
      });
    }
  };

  const shouldShowDateSeparator = (currentMessage: any, previousMessage: any) => {
    if (!previousMessage) return true;
    
    const currentDate = new Date(currentMessage.created_at).toDateString();
    const previousDate = new Date(previousMessage.created_at).toDateString();
    
    return currentDate !== previousDate;
  };

  const MessageItem = React.memo(({ message, index }: { message: any; index: number }) => {
    const isOwnMessage = message.sender_id === user?.id;
    const previousMessage = index > 0 ? messages[index - 1] : null;
    const showDateSeparator = shouldShowDateSeparator(message, previousMessage);

    return (
      <>
        {showDateSeparator && (
          <View style={styles.dateSeparator}>
            <View style={styles.dateSeparatorLine} />
            <Text style={styles.dateSeparatorText}>
              {formatMessageDate(message.created_at)}
            </Text>
            <View style={styles.dateSeparatorLine} />
          </View>
        )}
        
        <View style={[
          styles.messageContainer,
          isOwnMessage ? styles.ownMessageContainer : styles.otherMessageContainer
        ]}>
          {!isOwnMessage && conversation?.type !== 'private' && (
            <Text style={styles.senderName}>
              {message.sender_name || message.sender_email || 'Unknown'}
            </Text>
          )}
          
          <View style={[
            styles.messageBubble,
            isOwnMessage ? styles.ownMessageBubble : styles.otherMessageBubble
          ]}>
            {message.reply_content && (
              <View style={styles.replyContainer}>
                <View style={styles.replyBar} />
                <View style={styles.replyContent}>
                  <Text style={styles.replySender}>
                    {message.reply_sender_name || message.reply_sender_email}
                  </Text>
                  <Text style={styles.replyText} numberOfLines={2}>
                    {message.reply_content}
                  </Text>
                </View>
              </View>
            )}
            
            {message.message_type === 'image' && message.image_url && (
              <View style={styles.imageContainer}>
                <Image 
                  source={{ uri: message.image_url }} 
                  style={styles.messageImage}
                />
              </View>
            )}
            
            <Text style={[
              styles.messageText,
              isOwnMessage ? styles.ownMessageText : styles.otherMessageText
            ]}>
              {message.content}
            </Text>
            
            <View style={styles.messageFooter}>
              <Text style={[
                styles.messageTime,
                isOwnMessage ? styles.ownMessageTime : styles.otherMessageTime
              ]}>
                {formatMessageTime(message.created_at)}
              </Text>
              
              {message.is_edited && (
                <Text style={styles.editedIndicator}>edited</Text>
              )}
            </View>
          </View>
        </View>
      </>
    );
  }, (prevProps, nextProps) => {
    // Only re-render if the message itself has changed or if it's a different message
    return prevProps.message.id === nextProps.message.id && 
           prevProps.message.updated_at === nextProps.message.updated_at &&
           prevProps.index === nextProps.index;
  });

  if (messagesLoading && messages.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading messages...</Text>
        <ToastComponent />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </Pressable>
        
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {getConversationTitle()}
          </Text>
          {getConversationSubtitle() && (
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              {getConversationSubtitle()}
            </Text>
          )}
        </View>
        
        <Pressable style={styles.headerAction}>
          <Ionicons name="ellipsis-vertical" size={24} color={Colors.text} />
        </Pressable>
      </View>

      {messagesError && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{messagesError}</Text>
          <Button
            title="Retry"
            onPress={() => fetchMessages(conversationId!, 0)}
            variant="outline"
            size="small"
          />
        </View>
      )}

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <MessageItem key={item.id} message={item} index={index} />
        )}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={10}
        initialNumToRender={20}
        getItemLayout={(data, index) => ({
          length: 80, // Approximate height of a message
          offset: 80 * index,
          index,
        })}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              No messages yet. Start the conversation!
            </Text>
          </View>
        )}
        ListFooterComponent={sending ? (
          <View style={[styles.messageContainer, styles.ownMessageContainer]}>
            <View style={[styles.messageBubble, styles.ownMessageBubble, styles.sendingBubble]}>
              <ActivityIndicator size="small" color={Colors.primary} />
              <Text style={[styles.messageText, styles.sendingText]}>
                Sending...
              </Text>
            </View>
          </View>
        ) : null}
      />

      {/* Input */}
      <View style={styles.inputContainer}>
        <Pressable
          style={styles.attachButton}
          onPress={handleSendImage}
        >
          <Ionicons name="image" size={24} color={Colors.textLight} />
        </Pressable>
        
        <View style={styles.inputWrapper}>
          <Input
            placeholder="Type a message..."
            value={messageText}
            onChangeText={setMessageText}
            multiline
            style={styles.messageInput}
            containerStyle={styles.inputContainerStyle}
            onSubmitEditing={handleSendMessage}
            returnKeyType="send"
            blurOnSubmit={false}
          />
        </View>
        
        <Pressable
          style={[
            styles.sendButton,
            (!messageText.trim() || sending) && styles.sendButtonDisabled
          ]}
          onPress={handleSendMessage}
          disabled={!messageText.trim() || sending}
        >
          <Ionicons name="send" size={20} color={messageText.trim() && !sending ? Colors.primary : Colors.textLight} />
        </Pressable>
      </View>
      
      <ToastComponent />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.textLight,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.textLight,
    marginTop: 2,
  },
  headerAction: {
    padding: 8,
    marginLeft: 8,
  },
  errorContainer: {
    padding: 16,
    alignItems: 'center',
    backgroundColor: Colors.danger + '10',
  },
  errorText: {
    color: Colors.danger,
    marginBottom: 8,
    textAlign: 'center',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textLight,
    textAlign: 'center',
  },
  dateSeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dateSeparatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dateSeparatorText: {
    fontSize: 12,
    color: Colors.textLight,
    marginHorizontal: 16,
    backgroundColor: Colors.background,
    paddingHorizontal: 8,
  },
  messageContainer: {
    marginVertical: 4,
  },
  ownMessageContainer: {
    alignItems: 'flex-end',
  },
  otherMessageContainer: {
    alignItems: 'flex-start',
  },
  senderName: {
    fontSize: 12,
    color: Colors.textLight,
    marginBottom: 4,
    marginHorizontal: 12,
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  ownMessageBubble: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 6,
  },
  otherMessageBubble: {
    backgroundColor: Colors.card,
    borderBottomLeftRadius: 6,
  },
  sendingBubble: {
    opacity: 0.7,
    flexDirection: 'row',
    alignItems: 'center',
  },
  replyContainer: {
    flexDirection: 'row',
    marginBottom: 8,
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
  },
  replyBar: {
    width: 3,
    backgroundColor: Colors.primary,
    borderRadius: 2,
    marginRight: 8,
  },
  replyContent: {
    flex: 1,
  },
  replySender: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: 2,
  },
  replyText: {
    fontSize: 12,
    color: Colors.textLight,
    fontStyle: 'italic',
  },
  imageContainer: {
    marginBottom: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  ownMessageText: {
    color: 'white',
  },
  otherMessageText: {
    color: Colors.text,
  },
  sendingText: {
    marginLeft: 8,
    color: Colors.textLight,
    fontSize: 14,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  messageTime: {
    fontSize: 12,
  },
  ownMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  otherMessageTime: {
    color: Colors.textLight,
  },
  editedIndicator: {
    fontSize: 10,
    color: Colors.textLight,
    marginLeft: 4,
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  attachButton: {
    padding: 8,
    marginRight: 8,
  },
  inputWrapper: {
    flex: 1,
  },
  inputContainerStyle: {
    marginBottom: 0,
  },
  messageInput: {
    maxHeight: 100,
  },
  sendButton: {
    padding: 8,
    marginLeft: 8,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});