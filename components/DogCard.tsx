import React from 'react';
import { StyleSheet, Text, View, Image, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Dog } from '@/types';
import Colors from '@/constants/colors';
import StatusBadge from './StatusBadge';
import { MapPin } from 'lucide-react-native';

interface DogCardProps {
  dog: Dog;
}

export default function DogCard({ dog }: DogCardProps) {
  const router = useRouter();

  const handlePress = () => {
    router.push(`/dog/${dog.id}`);
  };

  return (
    <Pressable 
      style={({ pressed }) => [
        styles.container,
        pressed && styles.pressed
      ]}
      onPress={handlePress}
    >
      <Image 
        source={{ uri: dog.mainImage || 'https://images.unsplash.com/photo-1561037404-61cd46aa615b?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80' }} 
        style={styles.image} 
      />
      <View style={styles.infoContainer}>
        <View style={styles.header}>
          <Text style={styles.name}>{dog.name}</Text>
          <StatusBadge status={dog.status} size="small" />
        </View>
        
        <Text style={styles.breed}>
          {dog.breed || 'Unknown breed'}{dog.age ? `, ~${dog.age} years` : ''}
        </Text>
        
        {dog.lastSeen && dog.status === 'stray' && (
          <View style={styles.locationContainer}>
            <MapPin size={14} color={Colors.textLight} />
            <Text style={styles.location}>
              Last seen: {new Date(dog.lastSeen).toLocaleDateString()} at {dog.lastSeenLocation}
            </Text>
          </View>
        )}
        
        <View style={styles.tagsContainer}>
          {dog.isNeutered && (
            <View style={styles.tag}>
              <Text style={styles.tagText}>Neutered</Text>
            </View>
          )}
          {dog.isVaccinated && (
            <View style={styles.tag}>
              <Text style={styles.tagText}>Vaccinated</Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  image: {
    width: '100%',
    height: 180,
  },
  infoContainer: {
    padding: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  breed: {
    fontSize: 14,
    color: Colors.textLight,
    marginBottom: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  location: {
    fontSize: 12,
    color: Colors.textLight,
    marginLeft: 4,
    flex: 1,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  tag: {
    backgroundColor: Colors.border,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginRight: 8,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 12,
    color: Colors.text,
  },
});