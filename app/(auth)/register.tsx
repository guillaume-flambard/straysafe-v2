import React, { useState } from 'react';
import { StyleSheet, Text, View, Image, KeyboardAvoidingView, Platform, ScrollView, Alert, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/auth-store';
import { UserRole } from '@/types';
import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';
import Input from '@/components/Input';
import Button from '@/components/Button';
import Colors from '@/constants/colors';
import { User, MapPin, Mail, Lock, ArrowLeft } from 'lucide-react-native';

export default function RegisterScreen() {
  const router = useRouter();
  const { signUp, loading } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('volunteer');
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch locations for selection
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

  const roleOptions: { value: UserRole; label: string; description: string }[] = [
    { 
      value: 'volunteer', 
      label: 'Volunteer', 
      description: 'Help track and care for stray dogs in your area' 
    },
    { 
      value: 'vet', 
      label: 'Veterinarian', 
      description: 'Provide medical expertise and care guidance' 
    },
    { 
      value: 'viewer', 
      label: 'Viewer', 
      description: 'View and follow dog information (limited access)' 
    },
  ];

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!name.trim()) {
      newErrors.name = 'Full name is required';
    }
    
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!selectedLocationId) {
      newErrors.location = 'Please select a location';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    
    const result = await signUp(email, password, name, selectedRole, selectedLocationId);
    
    if (result.success) {
      if (result.message) {
        // Email confirmation required
        Alert.alert(
          'Account Created!', 
          result.message,
          [
            {
              text: 'OK',
              onPress: () => router.replace('/(auth)/login')
            }
          ]
        );
      } else {
        // Account created and logged in
        router.replace('/(tabs)');
      }
    } else {
      Alert.alert('Registration Failed', result.error || 'Please try again.');
    }
  };

  const RoleOption = ({ option }: { option: typeof roleOptions[0] }) => {
    const isSelected = selectedRole === option.value;
    
    return (
      <Pressable
        style={[
          styles.roleOption,
          isSelected && styles.roleOptionSelected
        ]}
        onPress={() => setSelectedRole(option.value)}
      >
        <View style={styles.roleOptionContent}>
          <View style={styles.roleHeader}>
            <Text style={[
              styles.roleTitle,
              isSelected && styles.roleTextSelected
            ]}>
              {option.label}
            </Text>
            {isSelected && (
              <View style={styles.checkmark}>
                <Text style={styles.checkmarkText}>✓</Text>
              </View>
            )}
          </View>
          <Text style={[
            styles.roleDescription,
            isSelected && styles.roleDescriptionSelected
          ]}>
            {option.description}
          </Text>
        </View>
      </Pressable>
    );
  };

  const LocationOption = ({ location }: { location: any }) => {
    const isSelected = selectedLocationId === location.id;
    
    return (
      <Pressable
        style={[
          styles.locationOption,
          isSelected && styles.locationOptionSelected
        ]}
        onPress={() => setSelectedLocationId(location.id)}
      >
        <MapPin 
          size={20} 
          color={isSelected ? Colors.primary : Colors.textLight} 
        />
        <Text style={[
          styles.locationText,
          isSelected && styles.locationTextSelected
        ]}>
          {location.name}
        </Text>
        {isSelected && (
          <View style={styles.checkmark}>
            <Text style={styles.checkmarkText}>✓</Text>
          </View>
        )}
      </Pressable>
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color={Colors.primary} />
          </Pressable>
          
          <View style={styles.logoContainer}>
            <Image 
              source={{ uri: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80' }}
              style={styles.logo}
            />
            <Text style={styles.title}>Join StraySafe</Text>
            <Text style={styles.subtitle}>Help protect stray dogs in your community</Text>
          </View>
        </View>
        
        <View style={styles.formContainer}>
          {/* Basic Information */}
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          <Input
            label="Full Name"
            placeholder="Enter your full name"
            value={name}
            onChangeText={setName}
            error={errors.name}
            leftIcon={<User size={20} color={Colors.textLight} />}
          />
          
          <Input
            label="Email"
            placeholder="Enter your email address"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
            error={errors.email}
            leftIcon={<Mail size={20} color={Colors.textLight} />}
          />
          
          <Input
            label="Password"
            placeholder="Create a password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            error={errors.password}
            leftIcon={<Lock size={20} color={Colors.textLight} />}
          />
          
          <Input
            label="Confirm Password"
            placeholder="Confirm your password"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            error={errors.confirmPassword}
            leftIcon={<Lock size={20} color={Colors.textLight} />}
          />

          {/* Role Selection */}
          <Text style={styles.sectionTitle}>Select Your Role</Text>
          {errors.role && <Text style={styles.errorText}>{errors.role}</Text>}
          
          <View style={styles.rolesContainer}>
            {roleOptions.map((option) => (
              <RoleOption key={option.value} option={option} />
            ))}
          </View>

          {/* Location Selection */}
          <Text style={styles.sectionTitle}>Select Your Location</Text>
          {errors.location && <Text style={styles.errorText}>{errors.location}</Text>}
          
          <View style={styles.locationsContainer}>
            {locations.map((location) => (
              <LocationOption key={location.id} location={location} />
            ))}
          </View>
          
          <Button
            title="Create Account"
            onPress={handleRegister}
            loading={loading}
            style={styles.registerButton}
            fullWidth
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: Colors.background,
    padding: 20,
  },
  header: {
    marginTop: 40,
    marginBottom: 30,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 20,
    padding: 5,
  },
  logoContainer: {
    alignItems: 'center',
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textLight,
    textAlign: 'center',
  },
  formContainer: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
    marginTop: 12,
  },
  rolesContainer: {
    marginBottom: 16,
  },
  roleOption: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  roleOptionSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '10',
  },
  roleOptionContent: {
    flex: 1,
  },
  roleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  roleTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  roleTextSelected: {
    color: Colors.primary,
  },
  roleDescription: {
    fontSize: 12,
    color: Colors.textLight,
  },
  roleDescriptionSelected: {
    color: Colors.primary + 'CC',
  },
  locationsContainer: {
    marginBottom: 16,
  },
  locationOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    marginBottom: 8,
  },
  locationOptionSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '10',
  },
  locationText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: Colors.text,
  },
  locationTextSelected: {
    color: Colors.primary,
    fontWeight: '500',
  },
  checkmark: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  checkmarkText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  registerButton: {
    marginTop: 10,
  },
  errorText: {
    color: Colors.danger,
    fontSize: 12,
    marginBottom: 8,
  },
});