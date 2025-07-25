import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/auth-store';
import { Dog } from '@/types';
import { Colors } from '@/constants/colors';

const { width } = Dimensions.get('window');
const cardWidth = (width - 48) / 2; // Account for padding and gap

interface MyDogCardProps {
  dog: Dog;
  onEdit: (dogId: string) => void;
}

const MyDogCard: React.FC<MyDogCardProps> = ({ dog, onEdit }) => {
  const handlePress = () => {
    router.push(`/dog/${dog.id}`);
  };

  const handleEdit = (e: any) => {
    e.stopPropagation();
    onEdit(dog.id);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'stray':
        return '#FF6B6B';
      case 'fostered':
        return '#4ECDC4';
      case 'adopted':
        return '#45B7D1';
      case 'deceased':
        return '#96CEB4';
      default:
        return Colors.textSecondary;
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 30) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <TouchableOpacity style={styles.dogCard} onPress={handlePress}>
      <View style={styles.cardHeader}>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(dog.status) }]}>
          <Text style={styles.statusText}>{dog.status}</Text>
        </View>
        <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
          <Ionicons name="pencil" size={16} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {dog.mainImage ? (
        <Image source={{ uri: dog.mainImage }} style={styles.dogImage} />
      ) : (
        <View style={styles.dogImagePlaceholder}>
          <Ionicons name="paw" size={32} color={Colors.textSecondary} />
        </View>
      )}

      <View style={styles.cardContent}>
        <Text style={styles.dogName} numberOfLines={1}>
          {dog.name}
        </Text>
        
        {dog.breed && (
          <Text style={styles.dogBreed} numberOfLines={1}>
            {dog.breed}
            {dog.age && ` • ${dog.age}y`}
          </Text>
        )}

        {dog.description && (
          <Text style={styles.dogDescription} numberOfLines={2}>
            {dog.description}
          </Text>
        )}

        <Text style={styles.createdDate}>
          Created {formatTime(dog.createdAt)}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export const MyDogsSection: React.FC = () => {
  const { user } = useAuth();

  const { data: myDogs = [], isLoading } = useQuery({
    queryKey: ['my-dogs', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('dogs')
        .select('*')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching my dogs:', error);
        throw error;
      }

      return (data || []).map(dog => ({
        id: dog.id,
        name: dog.name,
        status: dog.status,
        gender: dog.gender,
        locationId: dog.location_id,
        breed: dog.breed,
        age: dog.age,
        description: dog.description,
        lastSeen: dog.last_seen,
        lastSeenLocation: dog.last_seen_location,
        medicalNotes: dog.medical_notes,
        isNeutered: dog.is_neutered,
        isVaccinated: dog.is_vaccinated,
        mainImage: dog.main_image,
        createdAt: dog.created_at,
        updatedAt: dog.updated_at,
        createdBy: dog.created_by,
      })) as Dog[];
    },
    enabled: !!user,
    staleTime: 30000,
  });

  const handleEdit = (dogId: string) => {
    router.push(`/edit-dog/${dogId}`);
  };

  const handleAddNew = () => {
    router.push('/add');
  };

  if (!user) {
    return (
      <View style={styles.noAccessContainer}>
        <Text style={styles.noAccessText}>Please log in to view your dogs</Text>
      </View>
    );
  }

  if (myDogs.length === 0 && !isLoading) {
    return (
      <View style={styles.emptyState}>
        <Ionicons name="paw-outline" size={48} color={Colors.textSecondary} />
        <Text style={styles.emptyStateText}>No dogs posted yet</Text>
        <Text style={styles.emptyStateSubtext}>
          Start by adding a dog to help the community
        </Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAddNew}>
          <Ionicons name="add" size={20} color="white" />
          <Text style={styles.addButtonText}>Add First Dog</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          My Dogs ({myDogs.length})
        </Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAddNew}>
          <Ionicons name="add" size={16} color="white" />
          <Text style={styles.addButtonText}>Add Dog</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.grid}>
        {myDogs.map((dog) => (
          <MyDogCard
            key={dog.id}
            dog={dog}
            onEdit={handleEdit}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  dogCard: {
    width: cardWidth,
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  cardHeader: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  editButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dogImage: {
    width: '100%',
    height: 120,
    backgroundColor: Colors.background,
  },
  dogImagePlaceholder: {
    width: '100%',
    height: 120,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    padding: 12,
  },
  dogName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  dogBreed: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  dogDescription: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
    marginBottom: 8,
  },
  createdDate: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
    backgroundColor: Colors.background,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  noAccessContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    backgroundColor: Colors.background,
  },
  noAccessText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});