import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useDogFavorites, type FavoriteDog } from '@/hooks/dog-favorites-store';
import { Colors } from '@/constants/Colors';

const { width } = Dimensions.get('window');
const cardWidth = (width - 48) / 2; // Account for padding and gap

interface FavoriteDogCardProps {
  dog: FavoriteDog;
  onRemoveFromFavorites: (dogId: string) => void;
}

const FavoriteDogCard: React.FC<FavoriteDogCardProps> = ({
  dog,
  onRemoveFromFavorites,
}) => {
  const handlePress = () => {
    router.push(`/dog/${dog.id}`);
  };

  const handleRemoveFavorite = (e: any) => {
    e.stopPropagation();
    onRemoveFromFavorites(dog.id);
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
        <TouchableOpacity style={styles.favoriteButton} onPress={handleRemoveFavorite}>
          <Ionicons name="heart" size={20} color="#E91E63" />
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

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Ionicons name="heart-outline" size={14} color={Colors.textSecondary} />
            <Text style={styles.statText}>{dog.totalInterests}</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="chatbubble-outline" size={14} color={Colors.textSecondary} />
            <Text style={styles.statText}>{dog.commentCount}</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="people-outline" size={14} color={Colors.textSecondary} />
            <Text style={styles.statText}>{dog.followingCount}</Text>
          </View>
        </View>

        <Text style={styles.favoritedDate}>
          Favorited {formatTime(dog.favoritedAt)}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export const FavoriteDogsSection: React.FC = () => {
  const {
    favorites,
    isLoading,
    removeFromFavorites,
    refresh,
  } = useDogFavorites();

  if (favorites.length === 0 && !isLoading) {
    return (
      <View style={styles.emptyState}>
        <Ionicons name="heart-outline" size={48} color={Colors.textSecondary} />
        <Text style={styles.emptyStateText}>No favorite dogs yet</Text>
        <Text style={styles.emptyStateSubtext}>
          Tap the heart icon on dog profiles to add them to your favorites
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          Favorite Dogs ({favorites.length})
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.grid}>
          {favorites.map((dog) => (
            <FavoriteDogCard
              key={dog.id}
              dog={dog}
              onRemoveFromFavorites={removeFromFavorites}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
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
  favoriteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
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
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statText: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  favoritedDate: {
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
  },
});