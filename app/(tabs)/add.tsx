import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, Alert, Image, Pressable, Platform, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useDogs } from '@/hooks/dogs-store';
import { useAuth } from '@/hooks/auth-store';
import { Dog, DogGender, DogStatus } from '@/types';
import Colors from '@/constants/colors';
import Input from '@/components/Input';
import Button from '@/components/Button';
import { Camera, Check, X, Image as ImageIcon, MapPin, Upload, ChevronDown, Map } from 'lucide-react-native';
import { showToast, ToastComponent } from '@/utils/toast';
import { supabase } from '@/lib/supabase';
import { uploadDogImage } from '@/services/image-upload';
import { useQuery } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import MapView, { Marker } from 'react-native-maps';

// Koh Phangan center coordinates  
const KOH_PHANGAN_CENTER = { lat: 9.7380, lng: 100.0353 };

// Breed suggestions for autocomplete
const COMMON_BREEDS = [
  'Mixed breed', 'Thai Ridgeback', 'Golden Retriever', 'Labrador', 'German Shepherd',
  'Poodle', 'Beagle', 'Bulldog', 'Chihuahua', 'Siberian Husky', 'Street dog',
  'Shih Tzu', 'Border Collie', 'Rottweiler', 'Yorkshire Terrier'
];

export default function AddDogScreen() {
  const router = useRouter();
  const { addDog } = useDogs();
  const { user } = useAuth();

  // Fetch locations from database
  const { data: locations = [] } = useQuery({
    queryKey: ['locations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });
  
  const [name, setName] = useState('');
  const [breed, setBreed] = useState('');
  const [age, setAge] = useState('');
  const [description, setDescription] = useState('');
  const [lastSeenLocation, setLastSeenLocation] = useState('');
  const [medicalNotes, setMedicalNotes] = useState('');
  const [status, setStatus] = useState<DogStatus>('stray');
  const [gender, setGender] = useState<DogGender>('unknown');
  const [isNeutered, setIsNeutered] = useState(false);
  const [isVaccinated, setIsVaccinated] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // New state for improvements
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [currentLocation, setCurrentLocation] = useState<{latitude: number; longitude: number} | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showBreedSuggestions, setShowBreedSuggestions] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [selectedMapLocation, setSelectedMapLocation] = useState<{latitude: number; longitude: number} | null>(null);
  

  // Initialize with user's location if available
  useEffect(() => {
    if (user?.locationId && !selectedLocationId) {
      setSelectedLocationId(user.locationId);
    }
  }, [user?.locationId, selectedLocationId]);

  // Get current GPS location
  const getCurrentLocation = async () => {
    setIsGettingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        showToast('Location permission is required to capture GPS coordinates.', 'warning');
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      
      setCurrentLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      
      showToast('GPS coordinates captured successfully! 📍', 'success');
    } catch (error) {
      console.log('Error getting location:', error);
      showToast('Failed to get current location. Please try again.', 'error');
    } finally {
      setIsGettingLocation(false);
    }
  };

  // Upload image to Supabase Storage using new service
  const uploadImage = async (uri: string): Promise<string | null> => {
    if (!user) return null;
    
    try {
      setIsUploadingImage(true);
      
      const result = await uploadDogImage(uri, user.id, {
        compress: true,
        maxWidth: 1200,
        maxHeight: 1200,
        quality: 0.9
      });
      
      if (result.success && result.url) {
        console.log('✅ Dog image uploaded successfully:', result.url);
        return result.url;
      } else {
        console.error('❌ Dog image upload failed:', result.error);
        return null;
      }
    } catch (error) {
      console.error('Failed to upload image:', error);
      return null;
    } finally {
      setIsUploadingImage(false);
    }
  };

  const requestPermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
      const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (cameraStatus !== 'granted' || libraryStatus !== 'granted') {
        showToast('Camera and photo library permissions are required to add photos.', 'warning');
        return false;
      }
    }
    return true;
  };

  const pickImage = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    Alert.alert(
      'Select Photo',
      'Choose how you want to add a photo',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Camera', 
          onPress: () => takePhoto() 
        },
        { 
          text: 'Photo Library', 
          onPress: () => pickFromLibrary() 
        },
      ]
    );
  };

  const takePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      showToast('Failed to take photo. Please try again.', 'error');
    }
  };

  const pickFromLibrary = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      showToast('Failed to pick image. Please try again.', 'error');
    }
  };

  // Real-time validation
  const validateField = (field: string, value: string) => {
    const newErrors = { ...errors };
    
    switch (field) {
      case 'name':
        if (!value.trim()) {
          newErrors.name = 'Name is required';
        } else {
          delete newErrors.name;
        }
        break;
      case 'age':
        if (value && isNaN(Number(value))) {
          newErrors.age = 'Age must be a number';
        } else if (value && (Number(value) < 0 || Number(value) > 30)) {
          newErrors.age = 'Age must be between 0 and 30 years';
        } else {
          delete newErrors.age;
        }
        break;
      case 'location':
        if (!selectedLocationId) {
          newErrors.location = 'Please select a location';
        } else {
          delete newErrors.location;
        }
        break;
    }
    
    setErrors(newErrors);
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (age && isNaN(Number(age))) {
      newErrors.age = 'Age must be a number';
    } else if (age && (Number(age) < 0 || Number(age) > 30)) {
      newErrors.age = 'Age must be between 0 and 30 years';
    }
    
    if (!selectedLocationId) {
      newErrors.location = 'Please select a location';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    
    // Show loading state
    showToast('Adding dog to database...', 'info');
    
    let imageUrl = 'https://images.unsplash.com/photo-1561037404-61cd46aa615b?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80';
    
    // Upload image if provided
    if (imageUri) {
      const uploadedUrl = await uploadImage(imageUri);
      if (uploadedUrl) {
        imageUrl = uploadedUrl;
      } else {
        showToast('Image upload failed, using default image.', 'warning');
      }
    }
    
    const newDog: Omit<Dog, 'id' | 'createdAt' | 'updatedAt'> = {
      name,
      breed: breed || undefined,
      age: age ? Number(age) : undefined,
      description: description || undefined,
      lastSeenLocation: lastSeenLocation || undefined,
      lastSeen: status === 'stray' ? new Date().toISOString() : undefined,
      medicalNotes: medicalNotes || undefined,
      status,
      gender,
      isNeutered,
      isVaccinated,
      locationId: selectedLocationId,
      mainImage: imageUrl,
    };
    
    // Add GPS coordinates to description if available (prioritize map selection)
    const preciseLocation = selectedMapLocation || currentLocation;
    if (preciseLocation) {
      const sourceType = selectedMapLocation ? "Map Selected" : "GPS Captured";
      const gpsInfo = `\n\n📍 ${sourceType}: ${preciseLocation.latitude.toFixed(6)}, ${preciseLocation.longitude.toFixed(6)}`;
      newDog.description = (newDog.description || '') + gpsInfo;
    }
    
    try {
      const dog = await addDog(newDog);
      
      showToast(`${name} has been added successfully! 🎉`, 'success');
      
      // Auto-navigate to profile after short delay
      setTimeout(() => {
        router.push(`/dog/${dog.id}`);
      }, 1500);
    } catch (error) {
      console.error('Failed to add dog:', error);
      showToast('Failed to add dog. Please try again.', 'error');
    }
  };

  const resetForm = () => {
    setName('');
    setBreed('');
    setAge('');
    setDescription('');
    setLastSeenLocation('');
    setMedicalNotes('');
    setStatus('stray');
    setGender('unknown');
    setIsNeutered(false);
    setIsVaccinated(false);
    setImageUri(null);
    setSelectedLocationId(user?.locationId || '');
    setCurrentLocation(null);
    setSelectedMapLocation(null);
    setErrors({});
    setShowBreedSuggestions(false);
    setShowLocationPicker(false);
    setShowMapPicker(false);
  };

  const StatusOption = ({ value, label }: { value: DogStatus; label: string }) => (
    <Pressable
      style={[
        styles.statusOption,
        status === value && styles.statusOptionSelected
      ]}
      onPress={() => setStatus(value)}
    >
      <Text
        style={[
          styles.statusOptionText,
          status === value && styles.statusOptionTextSelected
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );

  const GenderOption = ({ value, label }: { value: DogGender; label: string }) => (
    <Pressable
      style={[
        styles.genderOption,
        gender === value && styles.genderOptionSelected
      ]}
      onPress={() => setGender(value)}
    >
      <Text
        style={[
          styles.genderOptionText,
          gender === value && styles.genderOptionTextSelected
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );

  const ToggleOption = ({ 
    value, 
    label, 
    onToggle 
  }: { 
    value: boolean; 
    label: string; 
    onToggle: () => void;
  }) => (
    <Pressable
      style={styles.toggleContainer}
      onPress={onToggle}
    >
      <View style={[
        styles.toggleButton,
        value ? styles.toggleButtonActive : styles.toggleButtonInactive
      ]}>
        {value ? <Check size={16} color="white" /> : <X size={16} color="white" />}
      </View>
      <Text style={styles.toggleLabel}>{label}</Text>
    </Pressable>
  );

  // Location Picker Component
  const LocationPicker = () => {
    const selectedLocation = locations.find(loc => loc.id === selectedLocationId);
    
    return (
      <View style={styles.locationPickerContainer}>
        <Text style={styles.sectionLabel}>
          Location *
          {errors.location && <Text style={styles.errorText}> - {errors.location}</Text>}
        </Text>
        <Pressable
          style={[
            styles.locationSelector,
            errors.location && styles.locationSelectorError
          ]}
          onPress={() => setShowLocationPicker(!showLocationPicker)}
        >
          <View style={styles.locationSelectorContent}>
            <MapPin size={16} color={Colors.textLight} />
            <Text style={[
              styles.locationSelectorText,
              !selectedLocationId && styles.locationSelectorPlaceholder
            ]}>
              {selectedLocation ? selectedLocation.name : 'Select location'}
            </Text>
          </View>
          <ChevronDown 
            size={16} 
            color={Colors.textLight}
            style={{ transform: [{ rotate: showLocationPicker ? '180deg' : '0deg' }] }}
          />
        </Pressable>
        
        {showLocationPicker && (
          <View style={styles.locationOptions}>
            {locations.map((location) => (
              <Pressable
                key={location.id}
                style={[
                  styles.locationOption,
                  selectedLocationId === location.id && styles.locationOptionSelected
                ]}
                onPress={() => {
                  setSelectedLocationId(location.id);
                  setShowLocationPicker(false);
                  validateField('location', location.id);
                }}
              >
                <MapPin 
                  size={14} 
                  color={selectedLocationId === location.id ? Colors.primary : Colors.textLight} 
                />
                <View style={styles.locationInfo}>
                  <Text style={[
                    styles.locationName,
                    selectedLocationId === location.id && styles.locationNameSelected
                  ]}>
                    {location.name}
                  </Text>
                  {location.description && (
                    <Text style={styles.locationDescription}>
                      {location.description}
                    </Text>
                  )}
                </View>
                {selectedLocationId === location.id && (
                  <Check size={14} color={Colors.primary} />
                )}
              </Pressable>
            ))}
          </View>
        )}
      </View>
    );
  };

  // Breed Input with Suggestions
  const BreedInput = () => {
    return (
      <View style={styles.breedInputContainer}>
        <Text style={styles.sectionLabel}>Breed</Text>
        <Pressable
          style={[
            styles.breedSelector,
            showBreedSuggestions && styles.breedSelectorOpen
          ]}
          onPress={() => setShowBreedSuggestions(!showBreedSuggestions)}
        >
          <Text style={[
            styles.breedSelectorText,
            !breed && styles.breedSelectorPlaceholder
          ]}>
            {breed || 'type breed'}
          </Text>
          <ChevronDown 
            size={16} 
            color={Colors.textLight}
            style={{ transform: [{ rotate: showBreedSuggestions ? '180deg' : '0deg' }] }}
          />
        </Pressable>
        
        {showBreedSuggestions && (
          <View style={styles.breedOptions}>
            <View style={styles.breedInputWrapper}>
              <Input
                placeholder="Type breed name..."
                value={breed}
                onChangeText={setBreed}
                containerStyle={styles.breedInput}
                autoFocus={false}
              />
            </View>
            <ScrollView style={styles.breedSuggestionsList} nestedScrollEnabled>
              {COMMON_BREEDS
                .filter(breedOption =>
                  breed === '' || breedOption.toLowerCase().includes(breed.toLowerCase())
                )
                .slice(0, 8)
                .map((breedOption) => (
                  <Pressable
                    key={breedOption}
                    style={[
                      styles.breedSuggestion,
                      breed === breedOption && styles.breedSuggestionSelected
                    ]}
                    onPress={() => {
                      setBreed(breedOption);
                      setShowBreedSuggestions(false);
                    }}
                  >
                    <Text style={[
                      styles.breedSuggestionText,
                      breed === breedOption && styles.breedSuggestionTextSelected
                    ]}>
                      {breedOption}
                    </Text>
                    {breed === breedOption && (
                      <Check size={16} color={Colors.primary} />
                    )}
                  </Pressable>
                ))}
            </ScrollView>
          </View>
        )}
      </View>
    );
  };

  // Map Location Picker Modal
  const MapLocationPicker = () => {
    const [tempLocation, setTempLocation] = useState(
      selectedMapLocation || 
      currentLocation || 
      { latitude: KOH_PHANGAN_CENTER.lat, longitude: KOH_PHANGAN_CENTER.lng }
    );

    const confirmLocation = () => {
      setSelectedMapLocation(tempLocation);
      setShowMapPicker(false);
      showToast(`Location selected: ${tempLocation.latitude.toFixed(4)}, ${tempLocation.longitude.toFixed(4)} 📍`, 'success');
    };

    return (
      <View style={styles.modalContainer}>
        <View style={styles.mapPickerModal}>
          <View style={styles.mapPickerHeader}>
            <Text style={styles.mapPickerTitle}>Select Precise Location</Text>
            <Pressable onPress={() => setShowMapPicker(false)}>
              <X size={24} color={Colors.textLight} />
            </Pressable>
          </View>
          
          <View style={styles.mapPickerContent}>
            <MapView
              style={styles.mapPicker}
              initialRegion={{
                latitude: tempLocation.latitude,
                longitude: tempLocation.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
              onPress={(event) => {
                setTempLocation(event.nativeEvent.coordinate);
              }}
            >
              <Marker
                coordinate={tempLocation}
                draggable
                onDragEnd={(event) => {
                  setTempLocation(event.nativeEvent.coordinate);
                }}
              />
            </MapView>
            
            <View style={styles.mapPickerInfo}>
              <Text style={styles.mapPickerCoords}>
                📍 {tempLocation.latitude.toFixed(6)}, {tempLocation.longitude.toFixed(6)}
              </Text>
              <Text style={styles.mapPickerHint}>
                Tap on the map or drag the marker to select the exact location
              </Text>
            </View>
          </View>
          
          <View style={styles.mapPickerActions}>
            <Button
              title="Cancel"
              onPress={() => setShowMapPicker(false)}
              variant="outline"
              style={styles.mapPickerButton}
            />
            <Button
              title="Confirm Location"
              onPress={confirmLocation}
              style={styles.mapPickerButton}
            />
          </View>
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Add New Dog</Text>
      
      <View style={styles.imageSection}>
        <Pressable style={styles.imagePlaceholder} onPress={pickImage}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.selectedImage} />
          ) : (
            <>
              <Camera size={40} color={Colors.placeholder} />
              <Text style={styles.imagePlaceholderText}>Add Photo</Text>
              <Text style={styles.imagePlaceholderSubtext}>Tap to take photo or select from library</Text>
            </>
          )}
          {isUploadingImage && (
            <View style={styles.uploadingOverlay}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.uploadingText}>Uploading...</Text>
            </View>
          )}
        </Pressable>
        {imageUri && !isUploadingImage && (
          <Button
            title="Change Photo"
            onPress={pickImage}
            variant="outline"
            size="small"
            style={styles.changePhotoButton}
            leftIcon={<ImageIcon size={16} color={Colors.primary} />}
          />
        )}
      </View>
      
      <View style={styles.formSection}>
        <Input
          label="Name *"
          placeholder="Enter dog's name"
          value={name}
          onChangeText={(value) => {
            setName(value);
            validateField('name', value);
          }}
          error={errors.name}
        />
        
        {/* Location Picker */}
        <LocationPicker />
        
        <BreedInput />
        
        <Input
          label="Age (years)"
          placeholder="Approximate age"
          value={age}
          onChangeText={(value) => {
            setAge(value);
            validateField('age', value);
          }}
          keyboardType="numeric"
          error={errors.age}
        />
        
        <Text style={styles.sectionLabel}>Status</Text>
        <View style={styles.statusContainer}>
          <StatusOption value="stray" label="Stray" />
          <StatusOption value="fostered" label="Fostered" />
          <StatusOption value="adopted" label="Adopted" />
          <StatusOption value="deceased" label="Deceased" />
        </View>
        
        <Text style={styles.sectionLabel}>Gender</Text>
        <View style={styles.genderContainer}>
          <GenderOption value="male" label="Male" />
          <GenderOption value="female" label="Female" />
          <GenderOption value="unknown" label="Unknown" />
        </View>
        
        <Text style={styles.sectionLabel}>Health Status</Text>
        <View style={styles.healthContainer}>
          <ToggleOption 
            value={isNeutered} 
            label="Neutered/Spayed" 
            onToggle={() => setIsNeutered(!isNeutered)} 
          />
          <ToggleOption 
            value={isVaccinated} 
            label="Vaccinated" 
            onToggle={() => setIsVaccinated(!isVaccinated)} 
          />
        </View>
        
        {status === 'stray' && (
          <Input
            label="Last Seen Location"
            placeholder="Where was the dog last seen?"
            value={lastSeenLocation}
            onChangeText={setLastSeenLocation}
          />
        )}
        
        <Input
          label="Description"
          placeholder="General description, behavior, etc."
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
          style={styles.textArea}
        />
        
        <Input
          label="Medical Notes"
          placeholder="Any known medical conditions or needs"
          value={medicalNotes}
          onChangeText={setMedicalNotes}
          multiline
          numberOfLines={3}
          style={styles.textArea}
        />
        
        {/* GPS Location Section */}
        <View style={styles.gpsSection}>
          <Text style={styles.sectionLabel}>Precise Location</Text>
          
          {/* GPS Capture Row */}
          <View style={styles.gpsRow}>
            <Button
              title={currentLocation ? "GPS Captured ✓" : "Use My GPS"}
              onPress={getCurrentLocation}
              variant={currentLocation ? "outline" : "primary"}
              loading={isGettingLocation}
              leftIcon={<MapPin size={16} color={currentLocation ? Colors.success : Colors.primary} />}
              style={styles.gpsButton}
            />
            <Button
              title="Select on Map"
              onPress={() => setShowMapPicker(true)}
              variant="outline"
              leftIcon={<Map size={16} color={Colors.primary} />}
              style={styles.gpsButton}
            />
          </View>
          
          {/* Display selected coordinates */}
          {(selectedMapLocation || currentLocation) && (
            <View style={styles.selectedLocationDisplay}>
              <Text style={styles.selectedLocationLabel}>
                {selectedMapLocation ? "📍 Map Selected:" : "📡 GPS Captured:"}
              </Text>
              <Text style={styles.gpsCoords}>
                {selectedMapLocation ? 
                  `${selectedMapLocation.latitude.toFixed(6)}, ${selectedMapLocation.longitude.toFixed(6)}` :
                  `${currentLocation!.latitude.toFixed(6)}, ${currentLocation!.longitude.toFixed(6)}`
                }
              </Text>
            </View>
          )}
          
          <Text style={styles.gpsHint}>
            Use your current GPS location or select a precise spot on the map where this dog was found
          </Text>
        </View>
        
        <Button
          title="Add Dog"
          onPress={handleSubmit}
          style={styles.submitButton}
          fullWidth
          loading={isUploadingImage}
        />
      </View>
      
      {/* Map Picker Modal */}
      {showMapPicker && <MapLocationPicker />}
      
      {/* Toast Notification */}
      <ToastComponent />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 20,
  },
  imageSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  imagePlaceholder: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: Colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  selectedImage: {
    width: '100%',
    height: '100%',
    borderRadius: 75,
  },
  imagePlaceholderText: {
    marginTop: 8,
    color: Colors.placeholder,
    fontSize: 14,
    fontWeight: '500',
  },
  imagePlaceholderSubtext: {
    marginTop: 4,
    color: Colors.placeholder,
    fontSize: 12,
    textAlign: 'center',
  },
  changePhotoButton: {
    marginTop: 12,
  },
  formSection: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
  },
  flex1: {
    flex: 1,
  },
  marginLeft: {
    marginLeft: 12,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 8,
    marginTop: 12,
  },
  statusContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  statusOption: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: Colors.background,
    marginRight: 8,
    marginBottom: 8,
  },
  statusOptionSelected: {
    backgroundColor: Colors.primary,
  },
  statusOptionText: {
    fontSize: 14,
    color: Colors.text,
  },
  statusOptionTextSelected: {
    color: 'white',
    fontWeight: '500',
  },
  genderContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  genderOption: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
  },
  genderOptionSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  genderOptionText: {
    fontSize: 14,
    color: Colors.text,
  },
  genderOptionTextSelected: {
    color: 'white',
    fontWeight: '500',
  },
  healthContainer: {
    marginBottom: 16,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  toggleButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  toggleButtonActive: {
    backgroundColor: Colors.success,
  },
  toggleButtonInactive: {
    backgroundColor: Colors.textLight,
  },
  toggleLabel: {
    fontSize: 14,
    color: Colors.text,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  submitButton: {
    marginTop: 20,
  },
  // New styles for improvements
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 75,
  },
  uploadingText: {
    marginTop: 8,
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '500',
  },
  locationPickerContainer: {
    marginBottom: 16,
  },
  locationSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    backgroundColor: Colors.background,
  },
  locationSelectorError: {
    borderColor: Colors.danger,
  },
  locationSelectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  locationSelectorText: {
    marginLeft: 8,
    fontSize: 14,
    color: Colors.text,
  },
  locationSelectorPlaceholder: {
    color: Colors.placeholder,
  },
  locationOptions: {
    marginTop: 4,
    backgroundColor: Colors.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  locationOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  locationOptionSelected: {
    backgroundColor: Colors.primary + '10',
  },
  locationInfo: {
    flex: 1,
    marginLeft: 8,
  },
  locationName: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
  },
  locationNameSelected: {
    color: Colors.primary,
  },
  locationDescription: {
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 2,
  },
  breedInputContainer: {
    marginBottom : 18,
    flex: 1,
    position: 'relative',
  },
  breedSuggestions: {
    position: 'absolute',
    top: 70,
    left: 0,
    right: 0,
    backgroundColor: Colors.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1000,
  },
  breedSuggestion: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  breedSuggestionText: {
    fontSize: 14,
    color: Colors.text,
  },
  gpsSection: {
    marginTop: 16,
    marginBottom: 8,
  },
  gpsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gpsButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  selectedLocationDisplay: {
    marginTop: 8,
    padding: 8,
    backgroundColor: Colors.success + '10',
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: Colors.success,
  },
  selectedLocationLabel: {
    fontSize: 12,
    color: Colors.success,
    fontWeight: '600',
    marginBottom: 2,
  },
  gpsCoords: {
    fontSize: 12,
    color: Colors.text,
    fontWeight: '500',
  },
  gpsHint: {
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 4,
    fontStyle: 'italic',
  },
  errorText: {
    color: Colors.danger,
    fontSize: 12,
  },
  // Map picker modal styles
  modalContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  mapPickerModal: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    width: '90%',
    maxHeight: '80%',
    overflow: 'hidden',
  },
  mapPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  mapPickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  mapPickerContent: {
    height: 400,
  },
  mapPicker: {
    flex: 1,
  },
  mapPickerInfo: {
    padding: 12,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  mapPickerCoords: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
  },
  mapPickerHint: {
    fontSize: 12,
    color: Colors.textLight,
    textAlign: 'center',
    marginTop: 4,
    fontStyle: 'italic',
  },
  mapPickerActions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  mapPickerButton: {
    flex: 1,
  },
  closeSuggestions: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    alignItems: 'center',
  },
  closeSuggestionsText: {
    fontSize: 12,
    color: Colors.textLight,
    fontWeight: '500',
  },
  breedSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 14,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    minHeight: 50,
  },
  breedSelectorOpen: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderBottomColor: 'transparent',
  },
  breedSelectorText: {
    fontSize: 16,
    color: Colors.text,
    flex: 1,
  },
  breedSelectorPlaceholder: {
    color: Colors.placeholder,
  },
  breedOptions: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    maxHeight: 250,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  breedInputWrapper: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  breedInput: {
    marginBottom: 0,
  },
  breedSuggestionsList: {
    maxHeight: 150,
  },
  breedSuggestionSelected: {
    backgroundColor: Colors.primary + '10',
    borderColor: Colors.primary + '30',
  },
  breedSuggestionTextSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },
});