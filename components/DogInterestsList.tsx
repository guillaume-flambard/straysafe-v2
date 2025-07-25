import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, Image, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/auth-store';
import { DogInterest, InterestType } from '@/types';
import Colors from '@/constants/colors';
import StartConversationButton from './StartConversationButton';

interface DogInterestedUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  type: InterestType;
  message?: string;
  createdAt: string;
}

interface DogInterestsListProps {
  dogId: string;
  dogName: string;
}

export default function DogInterestsList({ dogId, dogName }: DogInterestsListProps) {
  const { user, hasPermission } = useAuth();
  const [interestedUsers, setInterestedUsers] = useState<DogInterestedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<InterestType | 'all'>('all');

  useEffect(() => {
    fetchInterestedUsers();
  }, [dogId]);

  const fetchInterestedUsers = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('dog_interests_with_users')
        .select('*')
        .eq('dog_id', dogId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform data
      const users: DogInterestedUser[] = (data || []).map(item => ({
        id: item.user_id,
        name: item.user_name || 'Unknown',
        email: item.user_email || '',
        avatar: item.user_avatar,
        role: item.user_role,
        type: item.type,
        message: item.message,
        createdAt: item.created_at,
      }));

      setInterestedUsers(users);

    } catch (error) {
      console.error('Error fetching interested users:', error);
    } finally {
      setLoading(false);
    }
  };

  const getInterestIcon = (type: InterestType) => {
    switch (type) {
      case 'adoption': return 'heart';
      case 'fostering': return 'home';
      case 'sponsoring': return 'gift';
      case 'volunteering': return 'hand-left';
      default: return 'person';
    }
  };

  const getInterestColor = (type: InterestType) => {
    switch (type) {
      case 'adoption': return Colors.danger;
      case 'fostering': return Colors.secondary;
      case 'sponsoring': return Colors.primary;
      case 'volunteering': return Colors.success;
      default: return Colors.textLight;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return Colors.danger;
      case 'volunteer': return Colors.primary;
      case 'vet': return Colors.success;
      default: return Colors.textLight;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const filterButtons = [
    { key: 'all', label: 'All', count: interestedUsers.length },
    { key: 'adoption', label: 'Adoption', count: interestedUsers.filter(u => u.type === 'adoption').length },
    { key: 'fostering', label: 'Fostering', count: interestedUsers.filter(u => u.type === 'fostering').length },
    { key: 'sponsoring', label: 'Sponsoring', count: interestedUsers.filter(u => u.type === 'sponsoring').length },
    { key: 'volunteering', label: 'Volunteer', count: interestedUsers.filter(u => u.type === 'volunteering').length },
  ] as const;

  const filteredUsers = selectedType === 'all' 
    ? interestedUsers 
    : interestedUsers.filter(user => user.type === selectedType);

  const renderUserItem = ({ item: interestedUser }: { item: DogInterestedUser }) => (
    <View style={styles.userItem}>
      <Image
        source={{
          uri: interestedUser.avatar || 
               'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=crop&w=32&h=32'
        }}
        style={styles.userAvatar}
      />
      
      <View style={styles.userInfo}>
        <View style={styles.userHeader}>
          <Text style={styles.userName}>{interestedUser.name}</Text>
          <Text style={[styles.userRole, { color: getRoleColor(interestedUser.role) }]}>
            {interestedUser.role}
          </Text>
          <View style={styles.interestBadge}>
            <Ionicons 
              name={getInterestIcon(interestedUser.type)} 
              size={12} 
              color={getInterestColor(interestedUser.type)} 
            />
            <Text style={[styles.interestText, { color: getInterestColor(interestedUser.type) }]}>
              {interestedUser.type}
            </Text>
          </View>
        </View>
        
        <Text style={styles.timestamp}>
          {formatTimeAgo(interestedUser.createdAt)}
        </Text>
        
        {interestedUser.message && (
          <Text style={styles.userMessage} numberOfLines={2}>
            "{interestedUser.message}"
          </Text>
        )}
      </View>
      
      <StartConversationButton
        userId={interestedUser.id}
        userName={interestedUser.name}
        size="small"
        variant="outline"
        style={styles.messageButton}
      />
    </View>
  );

  // Only show to admins and volunteers
  if (!user || !hasPermission('volunteer')) {
    return null;
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading interested users...</Text>
      </View>
    );
  }

  if (interestedUsers.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="heart-outline" size={48} color={Colors.textLight} />
        <Text style={styles.emptyTitle}>No interested users yet</Text>
        <Text style={styles.emptySubtitle}>
          When users express interest in {dogName}, they will appear here
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Interested Users ({interestedUsers.length})</Text>
      
      <View style={styles.filterContainer}>
        {filterButtons.map((filter) => (
          <Pressable
            key={filter.key}
            style={[
              styles.filterButton,
              selectedType === filter.key && styles.filterButtonActive,
            ]}
            onPress={() => setSelectedType(filter.key)}
          >
            <Text style={[
              styles.filterButtonText,
              selectedType === filter.key && styles.filterButtonTextActive,
            ]}>
              {filter.label} ({filter.count})
            </Text>
          </Pressable>
        ))}
      </View>

      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => `${item.id}-${item.type}`}
        renderItem={renderUserItem}
        showsVerticalScrollIndicator={false}
        style={styles.usersList}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: Colors.textLight,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 16,
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
  },
  filterContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.border,
  },
  filterButtonActive: {
    backgroundColor: Colors.primary,
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.text,
  },
  filterButtonTextActive: {
    color: 'white',
  },
  usersList: {
    maxHeight: 400,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    backgroundColor: Colors.background,
    borderRadius: 8,
    marginBottom: 8,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginRight: 8,
  },
  userRole: {
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'uppercase',
    marginRight: 8,
  },
  interestBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.border,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  interestText: {
    fontSize: 10,
    fontWeight: '500',
    marginLeft: 4,
    textTransform: 'capitalize',
  },
  timestamp: {
    fontSize: 11,
    color: Colors.textLight,
    marginBottom: 4,
  },
  userMessage: {
    fontSize: 12,
    color: Colors.text,
    fontStyle: 'italic',
    lineHeight: 16,
  },
  messageButton: {
    marginLeft: 8,
    minWidth: 80,
  },
});