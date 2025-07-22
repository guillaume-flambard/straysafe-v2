import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, Pressable, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/auth-store';
import { useDogs } from '@/hooks/dogs-store';
import Colors from '@/constants/colors';
import { MessageCircle, Send, Search, Users } from 'lucide-react-native';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  dogId?: string;
  dogName?: string;
  isRead: boolean;
}

interface Conversation {
  id: string;
  participantId: string;
  participantName: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  dogId?: string;
  dogName?: string;
}

const mockConversations: Conversation[] = [
  {
    id: '1',
    participantId: '2',
    participantName: 'Volunteer Sarah',
    lastMessage: 'Max was spotted near the market again today',
    lastMessageTime: '2025-07-22T10:30:00.000Z',
    unreadCount: 2,
    dogId: '1',
    dogName: 'Max'
  },
  {
    id: '2',
    participantId: '3',
    participantName: 'Dr. Johnson (Vet)',
    lastMessage: 'Luna\'s vaccination is due next week',
    lastMessageTime: '2025-07-21T15:45:00.000Z',
    unreadCount: 0,
    dogId: '2',
    dogName: 'Luna'
  },
  {
    id: '3',
    participantId: '4',
    participantName: 'Foster Family',
    lastMessage: 'Thank you for the update on Bella!',
    lastMessageTime: '2025-07-20T09:15:00.000Z',
    unreadCount: 1,
    dogId: '4',
    dogName: 'Bella'
  }
];

export default function MessagesScreen() {
  const { user } = useAuth();
  const { dogs } = useDogs();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>(mockConversations);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredConversations = conversations.filter(conv =>
    conv.participantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (conv.dogName && conv.dogName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const ConversationItem = ({ conversation }: { conversation: Conversation }) => (
    <Pressable
      style={({ pressed }) => [
        styles.conversationItem,
        pressed && styles.conversationItemPressed
      ]}
      onPress={() => router.push(`/messages/${conversation.id}`)}
    >
      <View style={styles.avatarContainer}>
        <MessageCircle size={24} color={Colors.primary} />
      </View>
      
      <View style={styles.conversationContent}>
        <View style={styles.conversationHeader}>
          <Text style={styles.participantName}>{conversation.participantName}</Text>
          <Text style={styles.timestamp}>{formatTime(conversation.lastMessageTime)}</Text>
        </View>
        
        {conversation.dogName && (
          <Text style={styles.dogName}>About: {conversation.dogName}</Text>
        )}
        
        <Text 
          style={[
            styles.lastMessage,
            conversation.unreadCount > 0 && styles.unreadMessage
          ]}
          numberOfLines={2}
        >
          {conversation.lastMessage}
        </Text>
      </View>
      
      {conversation.unreadCount > 0 && (
        <View style={styles.unreadBadge}>
          <Text style={styles.unreadCount}>{conversation.unreadCount}</Text>
        </View>
      )}
    </Pressable>
  );

  if (!user) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Search size={20} color={Colors.placeholder} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search conversations..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={Colors.placeholder}
          />
        </View>
        
        <Pressable 
          style={styles.newChatButton}
          onPress={() => router.push('/messages/new')}
        >
          <Users size={20} color={Colors.primary} />
        </Pressable>
      </View>

      {filteredConversations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MessageCircle size={48} color={Colors.textLight} />
          <Text style={styles.emptyTitle}>No conversations yet</Text>
          <Text style={styles.emptySubtitle}>
            Start a conversation with other volunteers, vets, or foster families
          </Text>
          <Pressable 
            style={styles.startChatButton}
            onPress={() => router.push('/messages/new')}
          >
            <Text style={styles.startChatText}>Start New Chat</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={filteredConversations}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ConversationItem conversation={item} />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: Colors.text,
  },
  newChatButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: Colors.primary + '20',
  },
  listContent: {
    paddingBottom: 100,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  conversationItemPressed: {
    backgroundColor: Colors.background,
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  participantName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  timestamp: {
    fontSize: 12,
    color: Colors.textLight,
  },
  dogName: {
    fontSize: 12,
    color: Colors.primary,
    marginBottom: 4,
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
  unreadBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  unreadCount: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textLight,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  startChatButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
  },
  startChatText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});