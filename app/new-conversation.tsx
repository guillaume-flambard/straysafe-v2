import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, MessageCircle, Dog, MapPin, Users, Search, Check } from 'lucide-react-native';
import { useMessages } from '@/hooks/messages-store';
import { useDogs } from '@/hooks/dogs-store';
import { useAuth } from '@/hooks/auth-store';
import Colors from '@/constants/colors';
import Input from '@/components/Input';
import Button from '@/components/Button';
import { showToast, ToastComponent } from '@/utils/toast';
import { supabase } from '@/lib/supabase';
import type { CreateConversationParams } from '@/types/messages';

interface User {
  id: string;
  email: string;
  full_name?: string;
}

export default function NewConversationScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { createConversation } = useMessages();
  const { dogs } = useDogs();
  const { data: locations = [] } = useQuery({
    queryKey: ['locations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data || [];
    },
  });

  const [conversationType, setConversationType] = useState<'private' | 'dog_discussion' | 'location_group' | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedDog, setSelectedDog] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  // Fetch users for private conversations
  useEffect(() => {
    if (conversationType === 'private') {
      fetchUsers();
    }
  }, [conversationType, searchQuery]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('profiles') // Assuming you have a profiles table
        .select('id, email, full_name')
        .neq('id', user?.id); // Exclude current user

      if (searchQuery) {
        query = query.or(`email.ilike.%${searchQuery}%,full_name.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query.limit(20);
      
      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      // Fallback: try to get from auth.users (might need admin access)
      try {
        const { data, error } = await supabase.auth.admin.listUsers();
        if (!error && data.users) {
          const filteredUsers = data.users
            .filter(u => u.id !== user?.id)
            .filter(u => !searchQuery || u.email?.toLowerCase().includes(searchQuery.toLowerCase()))
            .slice(0, 20)
            .map(u => ({ id: u.id, email: u.email || '', full_name: u.user_metadata?.full_name }));
          setUsers(filteredUsers);
        }
      } catch (adminError) {
        showToast('Unable to load users', 'warning');
        setUsers([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUserSelect = (userId: string) => {
    if (conversationType === 'private') {
      setSelectedUsers([userId]); // Only one user for private chats
    } else {
      setSelectedUsers(prev => 
        prev.includes(userId) 
          ? prev.filter(id => id !== userId)
          : [...prev, userId]
      );
    }
  };

  const getConversationTitle = () => {
    switch (conversationType) {
      case 'private':
        return 'Private Conversation';
      case 'dog_discussion':
        return 'Dog Discussion';
      case 'location_group':
        return 'Location Group';
      default:
        return 'New Conversation';
    }
  };

  const canCreate = () => {
    if (!conversationType) return false;
    
    switch (conversationType) {
      case 'private':
        return selectedUsers.length === 1;
      case 'dog_discussion':
        return selectedDog && title.trim();
      case 'location_group':
        return selectedLocation && title.trim();
      default:
        return false;
    }
  };

  const handleCreate = async () => {
    if (!canCreate()) return;
    
    setCreating(true);
    
    try {
      const params: CreateConversationParams = {
        type: conversationType!,
        participant_ids: conversationType === 'private' ? selectedUsers : undefined,
        dog_id: selectedDog || undefined,
        location_id: selectedLocation || undefined,
        title: title.trim() || undefined,
        description: description.trim() || undefined,
      };

      const conversationId = await createConversation(params);
      
      if (conversationId) {
        router.replace(`/chat/${conversationId}`);
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
    } finally {
      setCreating(false);
    }
  };

  const ConversationTypeOption = ({ 
    type, 
    icon, 
    title: optionTitle, 
    subtitle,
    onPress
  }: {
    type: string;
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    onPress: () => void;
  }) => (
    <Pressable
      style={[
        styles.typeOption,
        conversationType === type && styles.typeOptionSelected
      ]}
      onPress={onPress}
    >
      <View style={styles.typeOptionIcon}>
        {icon}
      </View>
      <View style={styles.typeOptionContent}>
        <Text style={styles.typeOptionTitle}>{optionTitle}</Text>
        <Text style={styles.typeOptionSubtitle}>{subtitle}</Text>
      </View>
      {conversationType === type && (
        <Check size={20} color={Colors.primary} />
      )}
    </Pressable>
  );

  const UserItem = ({ user }: { user: User }) => (
    <Pressable
      style={[
        styles.userItem,
        selectedUsers.includes(user.id) && styles.userItemSelected
      ]}
      onPress={() => handleUserSelect(user.id)}
    >
      <View style={styles.userAvatar}>
        <Users size={20} color={Colors.textLight} />
      </View>
      <View style={styles.userContent}>
        <Text style={styles.userName}>
          {user.full_name || user.email}
        </Text>
        {user.full_name && (
          <Text style={styles.userEmail}>{user.email}</Text>
        )}
      </View>
      {selectedUsers.includes(user.id) && (
        <Check size={20} color={Colors.primary} />
      )}
    </Pressable>
  );

  const DogItem = ({ dog }: { dog: any }) => (
    <Pressable
      style={[
        styles.dogItem,
        selectedDog === dog.id && styles.dogItemSelected
      ]}
      onPress={() => setSelectedDog(dog.id)}
    >
      <View style={styles.dogAvatar}>
        <Dog size={20} color={Colors.primary} />
      </View>
      <View style={styles.dogContent}>
        <Text style={styles.dogName}>{dog.name}</Text>
        <Text style={styles.dogDetails}>
          {dog.breed && `${dog.breed} • `}
          {dog.status} • {dog.location?.name}
        </Text>
      </View>
      {selectedDog === dog.id && (
        <Check size={20} color={Colors.primary} />
      )}
    </Pressable>
  );

  const LocationItem = ({ location }: { location: any }) => (
    <Pressable
      style={[
        styles.locationItem,
        selectedLocation === location.id && styles.locationItemSelected
      ]}
      onPress={() => setSelectedLocation(location.id)}
    >
      <View style={styles.locationIcon}>
        <MapPin size={20} color={Colors.success} />
      </View>
      <View style={styles.locationContent}>
        <Text style={styles.locationName}>{location.name}</Text>
        {location.description && (
          <Text style={styles.locationDescription}>{location.description}</Text>
        )}
      </View>
      {selectedLocation === location.id && (
        <Check size={20} color={Colors.primary} />
      )}
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>New Conversation</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {!conversationType ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Choose conversation type</Text>
            
            <ConversationTypeOption
              type="private"
              icon={<MessageCircle size={24} color={Colors.secondary} />}
              title="Private Chat"
              subtitle="Direct message with another user"
              onPress={() => setConversationType('private')}
            />
            
            <ConversationTypeOption
              type="dog_discussion"
              icon={<Dog size={24} color={Colors.primary} />}
              title="Dog Discussion"
              subtitle="Public discussion about a specific dog"
              onPress={() => setConversationType('dog_discussion')}
            />
            
            <ConversationTypeOption
              type="location_group"
              icon={<MapPin size={24} color={Colors.success} />}
              title="Location Group"
              subtitle="Group chat for people in the same area"
              onPress={() => setConversationType('location_group')}
            />
          </View>
        ) : (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{getConversationTitle()}</Text>
              <Pressable 
                style={styles.changeTypeButton}
                onPress={() => {
                  setConversationType(null);
                  setSelectedUsers([]);
                  setSelectedDog(null);
                  setSelectedLocation(null);
                  setTitle('');
                  setDescription('');
                }}
              >
                <Text style={styles.changeTypeText}>Change</Text>
              </Pressable>
            </View>

            {conversationType === 'private' && (
              <>
                <View style={styles.searchContainer}>
                  <Input
                    placeholder="Search users..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    leftIcon={<Search size={16} color={Colors.textLight} />}
                    containerStyle={styles.searchInput}
                  />
                </View>

                {loading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator color={Colors.primary} />
                    <Text style={styles.loadingText}>Loading users...</Text>
                  </View>
                ) : (
                  <View style={styles.usersList}>
                    {users.map(user => (
                      <UserItem key={user.id} user={user} />
                    ))}
                    {users.length === 0 && (
                      <Text style={styles.emptyText}>No users found</Text>
                    )}
                  </View>
                )}
              </>
            )}

            {conversationType === 'dog_discussion' && (
              <>
                <Input
                  label="Discussion Title *"
                  placeholder="e.g., 'Help find Max' or 'Medical advice needed'"
                  value={title}
                  onChangeText={setTitle}
                />
                
                <Input
                  label="Description (optional)"
                  placeholder="Additional details about this discussion..."
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={3}
                />

                <Text style={styles.subsectionTitle}>Select Dog</Text>
                <ScrollView style={styles.dogsList} nestedScrollEnabled>
                  {dogs.map(dog => (
                    <DogItem key={dog.id} dog={dog} />
                  ))}
                  {dogs.length === 0 && (
                    <Text style={styles.emptyText}>No dogs available</Text>
                  )}
                </ScrollView>
              </>
            )}

            {conversationType === 'location_group' && (
              <>
                <Input
                  label="Group Title *"
                  placeholder="e.g., 'Koh Phangan Rescuers'"
                  value={title}
                  onChangeText={setTitle}
                />
                
                <Input
                  label="Description (optional)"
                  placeholder="What is this group for..."
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={3}
                />

                <Text style={styles.subsectionTitle}>Select Location</Text>
                <ScrollView style={styles.locationsList} nestedScrollEnabled>
                  {locations.map(location => (
                    <LocationItem key={location.id} location={location} />
                  ))}
                  {locations.length === 0 && (
                    <Text style={styles.emptyText}>No locations available</Text>
                  )}
                </ScrollView>
              </>
            )}

            <Button
              title="Create Conversation"
              onPress={handleCreate}
              disabled={!canCreate() || creating}
              loading={creating}
              style={styles.createButton}
              leftIcon={<MessageCircle size={16} color="white" />}
            />
          </View>
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
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  changeTypeButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: Colors.primary + '10',
    borderRadius: 6,
  },
  changeTypeText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 20,
    marginBottom: 12,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.card,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  typeOptionSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '05',
  },
  typeOptionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  typeOptionContent: {
    flex: 1,
  },
  typeOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  typeOptionSubtitle: {
    fontSize: 14,
    color: Colors.textLight,
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchInput: {
    marginBottom: 0,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginLeft: 12,
    color: Colors.textLight,
  },
  usersList: {
    maxHeight: 300,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: Colors.card,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  userItemSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '05',
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userContent: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
  },
  userEmail: {
    fontSize: 14,
    color: Colors.textLight,
    marginTop: 2,
  },
  dogsList: {
    maxHeight: 200,
  },
  dogItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: Colors.card,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dogItemSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '05',
  },
  dogAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  dogContent: {
    flex: 1,
  },
  dogName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
  },
  dogDetails: {
    fontSize: 14,
    color: Colors.textLight,
    marginTop: 2,
  },
  locationsList: {
    maxHeight: 200,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: Colors.card,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  locationItemSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '05',
  },
  locationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.success + '10',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  locationContent: {
    flex: 1,
  },
  locationName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
  },
  locationDescription: {
    fontSize: 14,
    color: Colors.textLight,
    marginTop: 2,
  },
  emptyText: {
    textAlign: 'center',
    color: Colors.textLight,
    padding: 20,
    fontStyle: 'italic',
  },
  createButton: {
    marginTop: 24,
  },
});