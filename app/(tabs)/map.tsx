import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Dimensions, Platform, Pressable, Modal, ScrollView, Image } from 'react-native';
import { useDogs } from '@/hooks/dogs-store';
import { useRouter } from 'expo-router';
import Colors from '@/constants/colors';
import { MapPin, X } from 'lucide-react-native';
import StatusBadge from '@/components/StatusBadge';
import { Dog } from '@/types';

const { width, height } = Dimensions.get('window');

// Koh Phangan coordinates and bounds
const KOH_PHANGAN_CENTER = { lat: 9.7380, lng: 100.0353 };
const MAP_BOUNDS = {
  north: 9.7800,
  south: 9.6900,
  east: 100.0800,
  west: 99.9800
};

// Generate realistic coordinates within Koh Phangan
const generateKohPhanganCoordinates = (index: number, total: number) => {
  const locations = [
    { lat: 9.7380, lng: 100.0353, name: "Thong Sala" }, // Main town
    { lat: 9.7500, lng: 100.0450, name: "Haad Rin" }, // Full Moon Party beach
    { lat: 9.7200, lng: 100.0200, name: "Srithanu" }, // Yoga area
    { lat: 9.7600, lng: 100.0300, name: "Chalok Lam" }, // North coast
    { lat: 9.7100, lng: 100.0500, name: "Haad Yuan" }, // East coast
    { lat: 9.7300, lng: 100.0100, name: "Haad Salad" }, // West coast
    { lat: 9.7450, lng: 100.0400, name: "Ban Tai" }, // South
    { lat: 9.7550, lng: 100.0250, name: "Mae Haad" }, // North west
  ];
  
  return locations[index % locations.length];
};

const SimpleMap = ({ dogs, onDogPress }: { dogs: Dog[], onDogPress: (dog: Dog) => void }) => {
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMapLoaded(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  if (!mapLoaded) {
    return (
      <View style={styles.mapPlaceholder}>
        <MapPin size={48} color={Colors.primary} />
        <Text style={styles.loadingText}>Loading Koh Phangan Map...</Text>
      </View>
    );
  }

  return (
    <View style={styles.mapContainer}>
      <View style={styles.mapBackground}>
        {/* Island outline */}
        <View style={styles.island} />
        
        {/* Main locations */}
        <View style={[styles.location, { left: width * 0.5, top: height * 0.4 }]}>
          <Text style={styles.locationText}>Thong Sala</Text>
        </View>
        <View style={[styles.location, { left: width * 0.7, top: height * 0.3 }]}>
          <Text style={styles.locationText}>Haad Rin</Text>
        </View>
        <View style={[styles.location, { left: width * 0.3, top: height * 0.5 }]}>
          <Text style={styles.locationText}>Srithanu</Text>
        </View>
        
        {/* Dog markers */}
        {dogs.map((dog, index) => {
          const coords = generateKohPhanganCoordinates(index, dogs.length);
          const x = ((coords.lng - MAP_BOUNDS.west) / (MAP_BOUNDS.east - MAP_BOUNDS.west)) * width;
          const y = ((MAP_BOUNDS.north - coords.lat) / (MAP_BOUNDS.north - MAP_BOUNDS.south)) * (height * 0.6);
          
          return (
            <Pressable
              key={dog.id}
              style={[
                styles.dogMarker,
                {
                  left: Math.max(20, Math.min(x - 15, width - 50)),
                  top: Math.max(80, Math.min(y + 80, height * 0.7)),
                  backgroundColor: dog.status === 'stray' ? Colors.danger : 
                                 dog.status === 'adopted' ? Colors.success : 
                                 dog.status === 'fostered' ? Colors.secondary : Colors.textLight
                }
              ]}
              onPress={() => onDogPress(dog)}
            >
              <MapPin size={20} color="white" />
            </Pressable>
          );
        })}
      </View>
      
      <View style={styles.mapOverlay}>
        <View style={styles.legend}>
          <Text style={styles.legendTitle}>Koh Phangan</Text>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: Colors.danger }]} />
            <Text style={styles.legendText}>Stray Dogs</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: Colors.secondary }]} />
            <Text style={styles.legendText}>Fostered</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: Colors.success }]} />
            <Text style={styles.legendText}>Adopted</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const DogModal = ({ dog, visible, onClose }: { dog: Dog | null, visible: boolean, onClose: () => void }) => {
  const router = useRouter();
  
  if (!dog) return null;

  const handleViewProfile = () => {
    onClose();
    router.push(`/dog/${dog.id}`);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{dog.name}</Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <X size={24} color={Colors.textLight} />
            </Pressable>
          </View>
          
          <Image 
            source={{ uri: dog.mainImage || 'https://images.unsplash.com/photo-1561037404-61cd46aa615b?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80' }} 
            style={styles.modalImage} 
          />
          
          <View style={styles.modalInfo}>
            <View style={styles.modalRow}>
              <StatusBadge status={dog.status} size="small" />
              <Text style={styles.modalBreed}>
                {dog.breed || 'Unknown breed'}{dog.age ? `, ~${dog.age} years` : ''}
              </Text>
            </View>
            
            {dog.description && (
              <Text style={styles.modalDescription} numberOfLines={3}>
                {dog.description}
              </Text>
            )}
            
            {dog.lastSeen && dog.status === 'stray' && (
              <View style={styles.modalLastSeen}>
                <MapPin size={14} color={Colors.textLight} />
                <Text style={styles.modalLastSeenText}>
                  Last seen: {new Date(dog.lastSeen).toLocaleDateString()}
                  {dog.lastSeenLocation && ` at ${dog.lastSeenLocation}`}
                </Text>
              </View>
            )}
          </View>
          
          <Pressable style={styles.viewProfileButton} onPress={handleViewProfile}>
            <Text style={styles.viewProfileText}>View Full Profile</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

export default function MapScreen() {
  const { dogs, isLoading } = useDogs();
  const [selectedDog, setSelectedDog] = useState<Dog | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const handleDogPress = (dog: Dog) => {
    setSelectedDog(dog);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedDog(null);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <MapPin size={48} color={Colors.primary} />
        <Text style={styles.loadingText}>Loading dogs...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SimpleMap dogs={dogs} onDogPress={handleDogPress} />
      
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{dogs.filter(d => d.status === 'stray').length}</Text>
          <Text style={styles.statLabel}>Stray Dogs</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{dogs.filter(d => d.status === 'fostered').length}</Text>
          <Text style={styles.statLabel}>Fostered</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{dogs.filter(d => d.status === 'adopted').length}</Text>
          <Text style={styles.statLabel}>Adopted</Text>
        </View>
      </View>
      
      <DogModal 
        dog={selectedDog} 
        visible={modalVisible} 
        onClose={handleCloseModal} 
      />
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
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.textLight,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  mapBackground: {
    flex: 1,
    backgroundColor: '#4A90E2',
    position: 'relative',
  },
  island: {
    position: 'absolute',
    left: width * 0.2,
    top: height * 0.15,
    width: width * 0.6,
    height: height * 0.5,
    backgroundColor: '#8FBC8F',
    borderRadius: width * 0.3,
    transform: [{ rotate: '15deg' }],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  location: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  locationText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.text,
  },
  dogMarker: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.card,
  },
  mapOverlay: {
    position: 'absolute',
    top: 20,
    right: 20,
  },
  legend: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: Colors.text,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: height * 0.7,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  closeButton: {
    padding: 4,
  },
  modalImage: {
    width: '100%',
    height: 200,
  },
  modalInfo: {
    padding: 16,
  },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalBreed: {
    fontSize: 14,
    color: Colors.textLight,
    marginLeft: 12,
    flex: 1,
  },
  modalDescription: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
    marginBottom: 12,
  },
  modalLastSeen: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalLastSeenText: {
    fontSize: 12,
    color: Colors.textLight,
    marginLeft: 4,
    flex: 1,
  },
  viewProfileButton: {
    backgroundColor: Colors.primary,
    margin: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  viewProfileText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});