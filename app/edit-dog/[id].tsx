import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, Alert, Image, Pressable, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { useDogs } from '@/hooks/dogs-store';
import { useAuth } from '@/hooks/auth-store';
import { Dog, DogGender, DogStatus } from '@/types';
import Colors from '@/constants/colors';
import Input from '@/components/Input';
import Button from '@/components/Button';
import { Ionicons } from '@expo/vector-icons';
import { showToast, ToastComponent } from '@/utils/toast';
import { supabase } from '@/lib/supabase';
import { uploadDogImage } from '@/services/image-upload';
import { useQuery } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';

// Breed suggestions for autocomplete
const COMMON_BREEDS = [
  'Mixed breed', 'Thai Ridgeback', 'Golden Retriever', 'Labrador', 'German Shepherd',
  'Poodle', 'Beagle', 'Bulldog', 'Chihuahua', 'Siberian Husky', 'Street dog',
  'Shih Tzu', 'Border Collie', 'Rottweiler', 'Yorkshire Terrier'
];

export default function EditDogScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getDog, updateDog } = useDogs();
  const { user, hasPermission } = useAuth();

  const dog = getDog(id);

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

  // Form state
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
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [images, setImages] = useState<{uri: string; caption?: string; id?: string; isNew?: boolean}[]>([]);
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showBreedSuggestions, setShowBreedSuggestions] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check permissions
  const isOwner = user?.id === dog?.createdBy;
  const canEdit = hasPermission('volunteer') || isOwner;

  if (!dog || !canEdit) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>
          {!dog ? 'Dog not found' : 'You do not have permission to edit this dog'}
        </Text>
        <Button title="Go Back" onPress={() => router.back()} variant="outline" />
      </View>
    );
  }

  // Load dog data into form
  useEffect(() => {
    if (dog) {
      setName(dog.name || '');
      setBreed(dog.breed || '');
      setAge(dog.age ? dog.age.toString() : '');
      setDescription(dog.description || '');
      setLastSeenLocation(dog.lastSeenLocation || '');
      setMedicalNotes(dog.medicalNotes || '');
      setStatus(dog.status);
      setGender(dog.gender);
      setIsNeutered(dog.isNeutered || false);
      setIsVaccinated(dog.isVaccinated || false);
      setSelectedLocationId(dog.locationId || '');
      
      // Load existing images
      loadDogImages();
    }
  }, [dog]);

  const loadDogImages = async () => {
    try {
      const { data: dogImages, error } = await supabase
        .from('dog_images')
        .select('*')
        .eq('dog_id', dog.id)
        .order('image_order');

      if (error) throw error;

      setImages(dogImages?.map(img => ({
        uri: img.image_url,
        caption: img.caption,
        id: img.id,
        isNew: false
      })) || []);
    } catch (error) {
      console.error('Error loading dog images:', error);
    } finally {
      setLoading(false);
    }
  };

  // Image handling functions
  const addImage = async () => {
    if (images.length >= 5) {
      showToast('Maximum 5 photos allowed', 'warning');
      return;
    }

    Alert.alert(
      'Add Photo',
      'Choose how you want to add a photo',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Camera', onPress: () => takePhoto() },
        { text: 'Photo Library', onPress: () => pickFromLibrary() },
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
        setImages(prev => [...prev, { uri: result.assets[0].uri, isNew: true }]);
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
        allowsMultipleSelection: true,
        selectionLimit: 5 - images.length,
      });

      if (!result.canceled && result.assets) {
        const newImages = result.assets.map(asset => ({ uri: asset.uri, isNew: true }));
        setImages(prev => [...prev, ...newImages]);
      }
    } catch (error) {
      showToast('Failed to pick images. Please try again.', 'error');
    }
  };

  const removeImage = async (index: number) => {
    const image = images[index];
    
    // If it's an existing image, delete from database
    if (image.id && !image.isNew) {
      try {
        const { error } = await supabase
          .from('dog_images')
          .delete()
          .eq('id', image.id);

        if (error) throw error;
      } catch (error) {
        console.error('Error deleting image:', error);
        showToast('Failed to delete image', 'error');
        return;
      }
    }

    setImages(prev => prev.filter((_, i) => i !== index));
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
    
    setIsUploadingImage(true);
    showToast('Updating dog information...', 'info');
    
    try {
      // Upload new images
      const newImages = images.filter(img => img.isNew);
      const uploadedImages: {url: string; caption?: string}[] = [];
      
      for (const image of newImages) {
        if (user) {
          const result = await uploadDogImage(image.uri, user.id, {
            compress: true,
            maxWidth: 1200,
            maxHeight: 1200,
            quality: 0.9
          });
          
          if (result.success && result.url) {
            uploadedImages.push({
              url: result.url,
              caption: image.caption
            });
          }
        }
      }

      // Save new images to database
      if (uploadedImages.length > 0) {
        const existingImagesCount = images.filter(img => !img.isNew).length;
        
        for (let i = 0; i < uploadedImages.length; i++) {
          const image = uploadedImages[i];
          const { error: imageError } = await supabase
            .from('dog_images')
            .insert({
              dog_id: dog.id,
              image_url: image.url,
              image_order: existingImagesCount + i,
              caption: image.caption,
              is_main: existingImagesCount === 0 && i === 0,
              uploaded_by: user?.id,
            });
          
          if (imageError) {
            console.error('Error saving dog image:', imageError);
          }
        }
      }

      // Update main image if we have images
      let mainImageUrl = dog.mainImage;
      const firstImage = images.find(img => !img.isNew) || uploadedImages[0];
      if (firstImage) {
        mainImageUrl = 'url' in firstImage ? firstImage.url : firstImage.uri;
      }
      
      // Update dog data
      const updatedData: Partial<Dog> = {
        name,
        breed: breed || undefined,
        age: age ? Number(age) : undefined,
        description: description || undefined,
        lastSeenLocation: lastSeenLocation || undefined,
        medicalNotes: medicalNotes || undefined,
        status,
        gender,
        isNeutered,
        isVaccinated,
        locationId: selectedLocationId,
        mainImage: mainImageUrl,
      };
      
      updateDog(dog.id, updatedData);
      
      showToast(`${name} has been updated successfully! 🎉`, 'success');
      
      setTimeout(() => {
        router.back();
      }, 1500);
    } catch (error) {
      console.error('Failed to update dog:', error);
      showToast('Failed to update dog. Please try again.', 'error');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const deleteDog = async () => {
    Alert.alert(
      'Delete Dog',
      'Are you sure you want to delete this dog? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              // Delete from database
              const { error } = await supabase
                .from('dogs')
                .delete()
                .eq('id', dog.id);

              if (error) throw error;

              showToast('Dog deleted successfully', 'success');
              router.replace('/');
            } catch (error) {
              console.error('Error deleting dog:', error);
              showToast('Failed to delete dog', 'error');
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading dog information...</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen 
        options={{
          title: `Edit ${dog.name}`,
          headerRight: () => isOwner ? (
            <Pressable 
              style={styles.deleteButton}
              onPress={deleteDog}
            >
              <Ionicons name="trash" size={20} color={Colors.danger} />
            </Pressable>
          ) : null,
        }} 
      />
      
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <View style={styles.imageSection}>
          <Text style={styles.sectionLabel}>Photos ({images.length}/5)</Text>
          
          {/* Images Gallery */}
          <ScrollView horizontal style={styles.imageGallery} showsHorizontalScrollIndicator={false}>
            {images.map((image, index) => (
              <View key={index} style={styles.imageContainer}>
                <Image source={{ uri: image.uri }} style={styles.galleryImage} />
                <View style={styles.imageOverlay}>
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => removeImage(index)}
                  >
                    <Ionicons name="close" size={16} color="white" />
                  </TouchableOpacity>
                  {index === 0 && (
                    <View style={styles.mainImageBadge}>
                      <Text style={styles.mainImageText}>MAIN</Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
            
            {/* Add Photo Button */}
            {images.length < 5 && (
              <Pressable style={styles.addPhotoButton} onPress={addImage}>
                <Ionicons name="camera" size={30} color={Colors.placeholder} />
                <Text style={styles.addPhotoText}>Add Photo</Text>
              </Pressable>
            )}
          </ScrollView>
          
          {/* Upload Progress */}
          {isUploadingImage && (
            <View style={styles.uploadProgress}>
              <ActivityIndicator size="small" color={Colors.primary} />
              <Text style={styles.uploadingText}>Uploading images...</Text>
            </View>
          )}
        </View>
        
        <View style={styles.formSection}>
          <Input
            label="Name *"
            placeholder="Enter dog's name"
            value={name}
            onChangeText={setName}
            error={errors.name}
          />
          
          <Text style={styles.sectionLabel}>Breed</Text>
          <Input
            placeholder="Enter breed"
            value={breed}
            onChangeText={setBreed}
          />
          
          <Input
            label="Age (years)"
            placeholder="Approximate age"
            value={age}
            onChangeText={setAge}
            keyboardType="numeric"
            error={errors.age}
          />
          
          <Text style={styles.sectionLabel}>Status</Text>
          <View style={styles.statusContainer}>
            {(['stray', 'fostered', 'adopted', 'deceased'] as DogStatus[]).map((statusOption) => (
              <Pressable
                key={statusOption}
                style={[
                  styles.statusOption,
                  status === statusOption && styles.statusOptionSelected
                ]}
                onPress={() => setStatus(statusOption)}
              >
                <Text
                  style={[
                    styles.statusOptionText,
                    status === statusOption && styles.statusOptionTextSelected
                  ]}
                >
                  {statusOption.charAt(0).toUpperCase() + statusOption.slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>
          
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
          
          <Button
            title="Update Dog"
            onPress={handleSubmit}
            style={styles.submitButton}
            fullWidth
            loading={isUploadingImage}
          />
        </View>
        
        <ToastComponent />
      </ScrollView>
    </>
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
  errorText: {
    fontSize: 16,
    color: Colors.danger,
    textAlign: 'center',
    marginBottom: 20,
  },
  deleteButton: {
    padding: 4,
  },
  imageSection: {
    marginBottom: 20,
  },
  imageGallery: {
    marginVertical: 10,
  },
  imageContainer: {
    width: 120,
    height: 120,
    marginRight: 12,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  galleryImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'space-between',
    padding: 8,
  },
  removeImageButton: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(255, 0, 0, 0.8)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainImageBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  mainImageText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  addPhotoButton: {
    width: 120,
    height: 120,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  addPhotoText: {
    fontSize: 12,
    color: Colors.placeholder,
    marginTop: 4,
    textAlign: 'center',
  },
  uploadProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    backgroundColor: Colors.background,
    borderRadius: 8,
    marginTop: 8,
  },
  uploadingText: {
    marginLeft: 8,
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '500',
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
    marginBottom: 16,
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
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  submitButton: {
    marginTop: 20,
  },
});