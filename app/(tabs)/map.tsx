import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Dimensions, Platform, Pressable, Modal, ScrollView, Image, ActivityIndicator } from 'react-native';
import { useDogs } from '@/hooks/dogs-store';
import { useRouter } from 'expo-router';
import Colors from '@/constants/colors';
import { MapPin, X, Filter, Heart, Home, Users } from 'lucide-react-native';
import StatusBadge from '@/components/StatusBadge';
import { Dog, DogStatus } from '@/types';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';

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

// Custom Marker Component
const CustomMarker = ({ dog, onPress }: { dog: Dog; onPress: () => void }) => {
  const getMarkerColor = () => {
    switch (dog.status) {
      case 'stray': return Colors.danger;
      case 'fostered': return Colors.primary;
      case 'adopted': return Colors.success;
      default: return Colors.textLight;
    }
  };

  const getMarkerIcon = () => {
    switch (dog.status) {
      case 'stray': return Heart;
      case 'fostered': return Users;
      case 'adopted': return Home;
      default: return MapPin;
    }
  };

  const IconComponent = getMarkerIcon();

  return (
    <Pressable
      style={[styles.customMarker, { borderColor: getMarkerColor() }]}
      onPress={onPress}
    >
      <View style={[styles.markerContent, { backgroundColor: getMarkerColor() }]}>
        <IconComponent size={16} color="white" />
      </View>
    </Pressable>
  );
};

// Filter Component
const MapFilters = ({ 
  activeFilters, 
  onFilterChange 
}: { 
  activeFilters: Set<DogStatus>; 
  onFilterChange: (status: DogStatus) => void; 
}) => {
  const filters: { status: DogStatus; label: string; color: string; icon: any }[] = [
    { status: 'stray', label: 'Stray', color: Colors.danger, icon: Heart },
    { status: 'fostered', label: 'Fostered', color: Colors.primary, icon: Users },
    { status: 'adopted', label: 'Adopted', color: Colors.success, icon: Home },
  ];

  return (
    <View style={styles.filtersContainer}>
      <View style={styles.filtersHeader}>
        <Filter size={16} color={Colors.text} />
        <Text style={styles.filtersTitle}>Filters</Text>
      </View>
      <View style={styles.filtersRow}>
        {filters.map(({ status, label, color, icon: IconComponent }) => {
          const isActive = activeFilters.has(status);
          return (
            <Pressable
              key={status}
              style={[
                styles.filterButton,
                { borderColor: color },
                isActive && { backgroundColor: color + '20' }
              ]}
              onPress={() => onFilterChange(status)}
            >
              <IconComponent 
                size={14} 
                color={isActive ? color : Colors.textLight} 
              />
              <Text 
                style={[
                  styles.filterText,
                  { color: isActive ? color : Colors.textLight }
                ]}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const SimpleMap = ({ 
  dogs, 
  onDogPress,
  userLocation 
}: { 
  dogs: Dog[]; 
  onDogPress: (dog: Dog) => void;
  userLocation: { latitude: number; longitude: number } | null;
}) => {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapRef, setMapRef] = useState<MapView | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setMapLoaded(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  if (!mapLoaded) {
    return (
      <View style={styles.mapPlaceholder}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading Koh Phangan Map...</Text>
      </View>
    );
  }

  const centerOnUser = () => {
    if (userLocation && mapRef) {
      mapRef.animateToRegion({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      }, 1000);
    }
  };

  return (
    <View style={styles.mapContainer}>
      <MapView
        ref={setMapRef}
        style={styles.map}
        initialRegion={{
          latitude: userLocation?.latitude || KOH_PHANGAN_CENTER.lat,
          longitude: userLocation?.longitude || KOH_PHANGAN_CENTER.lng,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        showsUserLocation={true}
        followsUserLocation={false}
        showsMyLocationButton={false}
      >
        {dogs.map((dog, index) => {
          const coords = generateKohPhanganCoordinates(index, dogs.length);
          return (
            <Marker
              key={dog.id}
              coordinate={{ latitude: coords.lat, longitude: coords.lng }}
              tracksViewChanges={false}
            >
              <CustomMarker 
                dog={dog} 
                onPress={() => onDogPress(dog)} 
              />
            </Marker>
          );
        })}
      </MapView>
      
      {/* User Location Button */}
      {userLocation && (
        <Pressable style={styles.locationButton} onPress={centerOnUser}>
          <MapPin size={20} color={Colors.primary} />
        </Pressable>
      )}
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
  const [activeFilters, setActiveFilters] = useState<Set<DogStatus>>(
    new Set(['stray', 'fostered', 'adopted'])
  );
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  // Request location permission and get user location
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const location = await Location.getCurrentPositionAsync({});
          setUserLocation({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
        }
      } catch (error) {
        console.log('Error getting location:', error);
        // Fallback to Koh Phangan center
        setUserLocation({
          latitude: KOH_PHANGAN_CENTER.lat,
          longitude: KOH_PHANGAN_CENTER.lng,
        });
      }
    })();
  }, []);

  const handleDogPress = (dog: Dog) => {
    setSelectedDog(dog);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedDog(null);
  };

  const handleFilterChange = (status: DogStatus) => {
    const newFilters = new Set(activeFilters);
    if (newFilters.has(status)) {
      newFilters.delete(status);
    } else {
      newFilters.add(status);
    }
    setActiveFilters(newFilters);
  };

  // Filter dogs based on active filters
  const filteredDogs = dogs.filter(dog => activeFilters.has(dog.status));

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
      <SimpleMap 
        dogs={filteredDogs} 
        onDogPress={handleDogPress}
        userLocation={userLocation}
      />
      
      {/* Filters */}
      <View style={styles.filtersWrapper}>
        <MapFilters 
          activeFilters={activeFilters}
          onFilterChange={handleFilterChange}
        />
      </View>
      
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {activeFilters.has('stray') ? dogs.filter(d => d.status === 'stray').length : 0}
          </Text>
          <Text style={styles.statLabel}>Stray Dogs</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {activeFilters.has('fostered') ? dogs.filter(d => d.status === 'fostered').length : 0}
          </Text>
          <Text style={styles.statLabel}>Fostered</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {activeFilters.has('adopted') ? dogs.filter(d => d.status === 'adopted').length : 0}
          </Text>
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
  map: {
    width: '100%',
    height: '100%',
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
  // New styles for improvements
  customMarker: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  markerContent: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationButton: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  filtersWrapper: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
  },
  filtersContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  filtersHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  filtersTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginLeft: 6,
  },
  filtersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 20,
    marginHorizontal: 2,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
});
