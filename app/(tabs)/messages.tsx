import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { MessageCircle, Users, Dog, MapPin, Plus, Search } from 'lucide-react-native';
import { useMessages } from '@/hooks/messages-store';
import Colors from '@/constants/colors';
import Input from '@/components/Input';
import Button from '@/components/Button';
import { showToast, ToastComponent } from '@/utils/toast';

export default function MessagesScreen() {
  const router = useRouter();
  const { 
    conversations, 
    conversationsLoading, 
    conversationsError,
    fetchConversations,
    presenceUsers,
    isUserOnline
  } = useMessages();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchConversations();
    setRefreshing(false);
  };

  const filteredConversations = conversations.filter(conversation => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      conversation.title?.toLowerCase().includes(query) ||
      conversation.dog_name?.toLowerCase().includes(query) ||
      conversation.location_name?.toLowerCase().includes(query) ||
      conversation.creator_email?.toLowerCase().includes(query) ||
      conversation.last_message_content?.toLowerCase().includes(query)
    );
  });

  const getConversationIcon = (conversation: any) => {
    switch (conversation.type) {
      case 'dog_discussion':
        return <Dog size={20} color={Colors.primary} />;
      case 'location_group':
        return <MapPin size={20} color={Colors.success} />;
      default:
        return <MessageCircle size={20} color={Colors.secondary} />;
    }
  };

  const getConversationTitle = (conversation: any) => {
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
    
    if (conversation.creator_email) return conversation.creator_email;
    return 'Private Chat';
  };

  const getConversationSubtitle = (conversation: any) => {
    const parts = [];
    
    if (conversation.participant_count) {
      parts.push(`${conversation.participant_count} participants`);
    }
    
    if (conversation.dog_name && conversation.type !== 'dog_discussion') {
      parts.push(`About: ${conversation.dog_name}`);
    }
    
    if (conversation.location_name) {
      parts.push(conversation.location_name);
    }

    return parts.join(' • ');
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('fr-FR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
    
    if (diffInHours < 168) { // Less than a week
      return date.toLocaleDateString('fr-FR', { 
        weekday: 'short' 
      });
    }
    
    return date.toLocaleDateString('fr-FR', { 
      day: '2-digit',
      month: '2-digit' 
    });
  };

  const ConversationItem = ({ conversation }: { conversation: any }) => (
    <Pressable 
      style={[
        styles.conversationItem,
        conversation.unread_count > 0 && styles.conversationItemUnread
      ]}
      onPress={() => router.push(`/chat/${conversation.id}`)}
    >
      <View style={styles.conversationIcon}>
        {getConversationIcon(conversation)}
      </View>
      
      <View style={styles.conversationContent}>
        <View style={styles.conversationHeader}>
          <Text style={styles.conversationTitle} numberOfLines={1}>
            {getConversationTitle(conversation)}
          </Text>
          <Text style={styles.conversationTime}>
            {formatTime(conversation.last_message_at)}
          </Text>
        </View>
        
        {getConversationSubtitle(conversation) && (
          <Text style={styles.conversationSubtitle} numberOfLines={1}>
            {getConversationSubtitle(conversation)}
          </Text>
        )}
        
        {conversation.last_message_content && (
          <Text style={styles.lastMessage} numberOfLines={1}>
            {conversation.last_message_sender && `${conversation.last_message_sender}: `}
            {conversation.last_message_content}
          </Text>
        )}
      </View>
      
      <View style={styles.conversationMeta}>
        {conversation.unread_count > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadCount}>
              {conversation.unread_count > 99 ? '99+' : conversation.unread_count}
            </Text>
          </View>
        )}
        
        {conversation.creator_email && isUserOnline(conversation.created_by) && (
          <View style={styles.onlineIndicator} />
        )}
      </View>
    </Pressable>
  );

  if (conversationsLoading && conversations.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading conversations...</Text>
        <ToastComponent />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
        <Button
          title=""
          onPress={() => router.push('/new-conversation')}
          variant="outline"
          size="small"
          leftIcon={<Plus size={16} color={Colors.primary} />}
          style={styles.newChatButton}
        />
      </View>
      
      <View style={styles.searchContainer}>
        <Input
          placeholder="Search conversations..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          leftIcon={<Search size={16} color={Colors.textLight} />}
          containerStyle={styles.searchInput}
        />
      </View>

      {conversationsError && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{conversationsError}</Text>
          <Button
            title="Retry"
            onPress={fetchConversations}
            variant="outline"
            size="small"
          />
        </View>
      )}

      <ScrollView 
        style={styles.conversationsList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
      >
        {filteredConversations.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MessageCircle size={64} color={Colors.textLight} />
            <Text style={styles.emptyTitle}>
              {searchQuery ? 'No conversations found' : 'No conversations yet'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery 
                ? 'Try adjusting your search terms' 
                : 'Start a new conversation to connect with other users!'
              }
            </Text>
            {!searchQuery && (
              <Button
                title="Start New Conversation"
                onPress={() => router.push('/new-conversation')}
                style={styles.startChatButton}
                leftIcon={<Plus size={16} color="white" />}
              />
            )}
          </View>
        ) : (
          filteredConversations.map((conversation) => (
            <ConversationItem 
              key={conversation.id} 
              conversation={conversation} 
            />
          ))
        )}
      </ScrollView>
      
      <ToastComponent />
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
  },
  newChatButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    padding: 0,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  searchInput: {
    marginBottom: 0,
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
  errorContainer: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: Colors.danger + '10',
    marginHorizontal: 20,
    marginVertical: 10,
    borderRadius: 8,
  },
  errorText: {
    color: Colors.danger,
    marginBottom: 12,
    textAlign: 'center',
  },
  conversationsList: {
    flex: 1,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  conversationItemUnread: {
    backgroundColor: Colors.primary + '05',
  },
  conversationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  conversationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
  },
  conversationTime: {
    fontSize: 12,
    color: Colors.textLight,
    marginLeft: 8,
  },
  conversationSubtitle: {
    fontSize: 12,
    color: Colors.textLight,
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 14,
    color: Colors.textLight,
    lineHeight: 18,
  },
  conversationMeta: {
    alignItems: 'center',
    marginLeft: 8,
  },
  unreadBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginBottom: 4,
  },
  unreadCount: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  onlineIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.success,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    minHeight: 400,
  },
  emptyTitle: {
    fontSize: 20,
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
    marginBottom: 24,
  },
  startChatButton: {
    paddingHorizontal: 24,
  },
});