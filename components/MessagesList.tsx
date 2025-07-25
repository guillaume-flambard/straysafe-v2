import React, { useState, useRef, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  FlatList, 
  TextInput, 
  Pressable, 
  Image,
  Alert,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MessageWithUser } from '@/types';
import { useAuth } from '@/hooks/auth-store';
import Colors from '@/constants/colors';
import Button from './Button';

interface MessagesListProps {
  messages: MessageWithUser[];
  onSendMessage: (content: string) => Promise<boolean>;
  loading: boolean;
  submitting: boolean;
}

interface MessageItemProps {
  message: MessageWithUser;
  isFromCurrentUser: boolean;
  showAvatar: boolean;
}

function MessageItem({ message, isFromCurrentUser, showAvatar }: MessageItemProps) {
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <View style={[
      styles.messageContainer,
      isFromCurrentUser ? styles.sentMessage : styles.receivedMessage
    ]}>
      {!isFromCurrentUser && showAvatar && (
        <Image
          source={{
            uri: message.sender.avatar || 
                 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=crop&w=32&h=32'
          }}
          style={styles.messageAvatar}
        />
      )}
      
      <View style={[
        styles.messageBubble,
        isFromCurrentUser ? styles.sentBubble : styles.receivedBubble,
        !isFromCurrentUser && !showAvatar && styles.receivedBubbleNoAvatar
      ]}>
        {!isFromCurrentUser && showAvatar && (
          <Text style={styles.senderName}>{message.sender.name}</Text>
        )}
        
        <Text style={[
          styles.messageText,
          isFromCurrentUser ? styles.sentText : styles.receivedText
        ]}>
          {message.content}
        </Text>
        
        <Text style={[
          styles.messageTime,
          isFromCurrentUser ? styles.sentTime : styles.receivedTime
        ]}>
          {formatTime(message.createdAt)}
        </Text>
      </View>
    </View>
  );
}

export default function MessagesList({ 
  messages, 
  onSendMessage, 
  loading, 
  submitting 
}: MessagesListProps) {
  const { user } = useAuth();
  const [newMessage, setNewMessage] = useState('');
  const flatListRef = useRef<FlatList>(null);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    const success = await onSendMessage(newMessage.trim());
    if (success) {
      setNewMessage('');
    }
  };

  // Group messages by date and determine when to show avatars
  const processedMessages = messages.map((message, index) => {
    const prevMessage = index > 0 ? messages[index - 1] : null;
    const isFromCurrentUser = message.senderId === user?.id;
    
    // Show avatar if it's the first message from this sender in a sequence
    const showAvatar = !isFromCurrentUser && (
      !prevMessage || 
      prevMessage.senderId !== message.senderId ||
      prevMessage.senderId === user?.id
    );

    // Show date separator if it's a new day
    const showDateSeparator = !prevMessage || 
      new Date(message.createdAt).toDateString() !== new Date(prevMessage.createdAt).toDateString();

    return {
      ...message,
      isFromCurrentUser,
      showAvatar,
      showDateSeparator,
    };
  });

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  const renderMessage = ({ item, index }: { item: any; index: number }) => (
    <View>
      {item.showDateSeparator && (
        <View style={styles.dateSeparator}>
          <Text style={styles.dateSeparatorText}>
            {new Date(item.createdAt).toDateString() === new Date().toDateString() 
              ? 'Today' 
              : new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
      )}
      <MessageItem
        message={item}
        isFromCurrentUser={item.isFromCurrentUser}
        showAvatar={item.showAvatar}
      />
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading messages...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={processedMessages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        style={styles.messagesList}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubble-outline" size={48} color={Colors.textLight} />
            <Text style={styles.emptyText}>Start the conversation!</Text>
          </View>
        )}
      />
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.messageInput}
          placeholder="Type a message..."
          placeholderTextColor={Colors.textLight}
          value={newMessage}
          onChangeText={setNewMessage}
          multiline
          maxLength={1000}
          onSubmitEditing={handleSendMessage}
          returnKeyType="send"
        />
        <Pressable
          style={[
            styles.sendButton,
            (!newMessage.trim() || submitting) && styles.sendButtonDisabled
          ]}
          onPress={handleSendMessage}
          disabled={!newMessage.trim() || submitting}
        >
          <Ionicons 
            name="send" 
            size={20} 
            color={(!newMessage.trim() || submitting) ? Colors.textLight : Colors.primary} 
          />
        </Pressable>
      </View>
    </View>
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
    padding: 32,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textLight,
  },
  messagesList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textLight,
    marginTop: 16,
  },
  dateSeparator: {
    alignItems: 'center',
    marginVertical: 16,
  },
  dateSeparatorText: {
    fontSize: 12,
    color: Colors.textLight,
    backgroundColor: Colors.card,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  messageContainer: {
    flexDirection: 'row',
    marginVertical: 2,
    alignItems: 'flex-end',
  },
  sentMessage: {
    justifyContent: 'flex-end',
  },
  receivedMessage: {
    justifyContent: 'flex-start',
  },
  messageAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 8,
    marginBottom: 4,
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    marginVertical: 1,
  },
  sentBubble: {
    backgroundColor: Colors.primary,
    marginLeft: 'auto',
  },
  receivedBubble: {
    backgroundColor: Colors.card,
    marginRight: 'auto',
  },
  receivedBubbleNoAvatar: {
    marginLeft: 36, // Account for avatar space
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  sentText: {
    color: 'white',
  },
  receivedText: {
    color: Colors.text,
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
  },
  sentTime: {
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'right',
  },
  receivedTime: {
    color: Colors.textLight,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  messageInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 16,
    color: Colors.text,
    backgroundColor: Colors.background,
    maxHeight: 100,
    marginRight: 8,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  sendButtonDisabled: {
    borderColor: Colors.border,
  },
});