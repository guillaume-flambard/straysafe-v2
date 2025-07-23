import React, { useState, useMemo } from 'react';
import { StyleSheet, View, FlatList, Text, ActivityIndicator, Animated } from 'react-native';
import { useDogs } from '@/hooks/dogs-store';
import { DogStatus } from '@/types';
import Colors from '@/constants/colors';
import DogCard from '@/components/DogCard';
import FilterTabs from '@/components/FilterTabs';
import { Ionicons } from '@expo/vector-icons';
import Input from '@/components/Input';

export default function DogsScreen() {
  const { dogs, isLoading } = useDogs();
  const [selectedFilter, setSelectedFilter] = useState<DogStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  const filteredDogs = useMemo(() => {
    let filtered = dogs;
    
    // Apply status filter
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(dog => dog.status === selectedFilter);
    }
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(dog => 
        dog.name.toLowerCase().includes(query) || 
        (dog.breed && dog.breed.toLowerCase().includes(query))
      );
    }
    
    return filtered;
  }, [dogs, selectedFilter, searchQuery]);

  // Calculate counts for filter tabs
  const counts = useMemo(() => {
    return {
      all: dogs.length,
      stray: dogs.filter(dog => dog.status === 'stray').length,
      fostered: dogs.filter(dog => dog.status === 'fostered').length,
      adopted: dogs.filter(dog => dog.status === 'adopted').length,
      deceased: dogs.filter(dog => dog.status === 'deceased').length,
    };
  }, [dogs]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Input
          placeholder="Search dogs by name or breed..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          containerStyle={styles.searchInputContainer}
          style={styles.searchInput}
          leftIcon={<Ionicons name="search" size={20} color={Colors.placeholder} />}
        />
      </View>
      
      <FilterTabs 
        selectedFilter={selectedFilter} 
        onFilterChange={setSelectedFilter}
        counts={counts}
      />
      
      <View style={styles.contentContainer}>
        {filteredDogs.length === 0 ? (
          <Animated.View style={[styles.emptyContainer, { opacity: fadeAnim }]}>
            <Text style={styles.emptyText}>No dogs found</Text>
            <Text style={styles.emptySubtext}>
              {searchQuery 
                ? 'Try adjusting your search or filters' 
                : 'Add a new dog to get started'}
            </Text>
          </Animated.View>
        ) : (
          <Animated.View style={[styles.listContainer, { opacity: fadeAnim }]}>
            <FlatList
              data={filteredDogs}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => <DogCard dog={item} />}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          </Animated.View>
        )}
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
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  searchInputContainer: {
    marginBottom: 0,
  },
  searchInput: {
    backgroundColor: Colors.card,
    borderRadius: 8,
  },
  contentContainer: {
    flex: 1,
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
    paddingBottom: 120,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textLight,
    textAlign: 'center',
  },
});