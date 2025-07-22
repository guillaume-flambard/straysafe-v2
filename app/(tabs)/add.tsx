import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Alert, Image, Pressable, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useDogs } from '@/hooks/dogs-store';
import { Dog, DogGender, DogStatus } from '@/types';
import Colors from '@/constants/colors';
import Input from '@/components/Input';
import Button from '@/components/Button';
import { Camera, Check, X, Image as ImageIcon } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';

export default function AddDogScreen() {
  const router = useRouter();
  const { addDog } = useDogs();

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

  const requestPermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
      const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (cameraStatus !== 'granted' || libraryStatus !== 'granted') {
        Alert.alert('Permission needed', 'Camera and photo library permissions are required to add photos.');
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
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const pickFromLibrary = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (age && isNaN(Number(age))) {
      newErrors.age = 'Age must be a number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    
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
      locationId: locations[0]?.id || '',
      mainImage: imageUri || 'https://images.unsplash.com/photo-1561037404-61cd46aa615b?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    };
    
    const dog = addDog(newDog);
    
    Alert.alert(
      'Success',
      `${name} has been added successfully!`,
      [
        {
          text: 'View Profile',
          onPress: () => router.push(`/dog/${dog.id}`),
        },
        {
          text: 'Add Another',
          onPress: () => {
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
          },
        },
      ]
    );
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
        </Pressable>
        {imageUri && (
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
          onChangeText={setName}
          error={errors.name}
        />
        
        <View style={styles.row}>
          <Input
            label="Breed"
            placeholder="Enter breed if known"
            value={breed}
            onChangeText={setBreed}
            containerStyle={styles.flex1}
          />
          
          <Input
            label="Age (years)"
            placeholder="Approximate age"
            value={age}
            onChangeText={setAge}
            keyboardType="numeric"
            error={errors.age}
            containerStyle={[styles.flex1, styles.marginLeft]}
          />
        </View>
        
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
        
        <Button
          title="Add Dog"
          onPress={handleSubmit}
          style={styles.submitButton}
          fullWidth
        />
      </View>
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
});