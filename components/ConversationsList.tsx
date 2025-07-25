import React from 'react';
import { StyleSheet, Text, View, FlatList, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ConversationWithDetails } from '@/types';
import Colors from '@/constants/colors';

interface ConversationsListProps {
  conversations: ConversationWithDetails[];
  onConversationPress: (conversation: ConversationWithDetails) => void;
  loading: boolean;
}

interface ConversationItemProps {
  conversation: ConversationWithDetails;
  onPress: (conversation: ConversationWithDetails) => void;
}

function ConversationItem({ conversation, onPress }: ConversationItemProps) {
  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const messageDate = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - messageDate.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Now';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d`;
    return messageDate.toLocaleDateString();
  };

  return (
    <Pressable
      style={styles.conversationItem}
      onPress={() => onPress(conversation)}
    >
      <Image
        source={{
          uri: conversation.otherParticipant.avatar || 
               'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=crop&w=32&h=32'
        }}
        style={styles.avatar}
      />
      
      <View style={styles.conversationContent}>
        <View style={styles.conversationHeader}>
          <Text style={styles.participantName}>
            {conversation.otherParticipant.name}
          </Text>
          <Text style={[
            styles.userRole, 
            { color: getRoleColor(conversation.otherParticipant.role) }
          ]}>
            {conversation.otherParticipant.role}
          </Text>
          {conversation.lastMessageAt && (
            <Text style={styles.timestamp}>
              {formatTimeAgo(conversation.lastMessageAt)}
            </Text>
          )}
        </View>
        
        {conversation.lastMessage && (
          <Text 
            style={[
              styles.lastMessage,
              conversation.unreadCount > 0 && styles.unreadMessage
            ]} 
            numberOfLines={1}
          >
            {conversation.lastMessage}
          </Text>
        )}
      </View>
      
      <View style={styles.conversationMeta}>
        {conversation.unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadCount}>
              {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
            </Text>
          </View>
        )}
        <Ionicons name="chevron-forward" size={16} color={Colors.textLight} />
      </View>
    </Pressable>
  );
}

const getRoleColor = (role: string) => {
  switch (role) {
    case 'admin': return Colors.danger;
    case 'volunteer': return Colors.primary;
    case 'vet': return Colors.success;
    default: return Colors.textLight;
  }
};

export default function ConversationsList({ 
  conversations, 
  onConversationPress, 
  loading 
}: ConversationsListProps) {
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading conversations...</Text>
      </View>
    );
  }

  if (conversations.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="chatbubbles-outline" size={64} color={Colors.textLight} />
        <Text style={styles.emptyTitle}>No conversations yet</Text>
        <Text style={styles.emptySubtitle}>
          Start a conversation with other users by visiting their profiles or commenting on dog posts
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={conversations}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <ConversationItem 
          conversation={item} 
          onPress={onConversationPress}
        />
      )}
      style={styles.list}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textLight,
    textAlign: 'center',
    lineHeight: 20,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  participantName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginRight: 8,
  },
  userRole: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    marginRight: 8,
  },
  timestamp: {
    fontSize: 12,
    color: Colors.textLight,
    marginLeft: 'auto',
  },
  lastMessage: {
    fontSize: 14,
    color: Colors.textLight,
    lineHeight: 18,
  },
  unreadMessage: {
    color: Colors.text,
    fontWeight: '500',
  },
  conversationMeta: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  unreadBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginBottom: 4,
    minWidth: 20,
    alignItems: 'center',
  },
  unreadCount: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
});