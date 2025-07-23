import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/hooks/auth-store';
import { supabase } from '@/lib/supabase';
import { uploadProfileImage } from '@/services/image-upload';
import Colors from '@/constants/colors';
import Button from '@/components/Button';
import Input from '@/components/Input';
import { showToast, ToastComponent } from '@/utils/toast';

interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  bio?: string;
  location?: string;
  location_id?: string;
  role?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export default function AccountSettingsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    console.log('AccountSettings - user:', user ? 'exists' : 'null');
    if (user) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      if (data) {
        setProfile(data);
      } else {
        // Create basic profile
        const basicProfile = {
          id: user.id,
          email: user.email || '',
          full_name: (user as any).user_metadata?.full_name || '',
          avatar_url: (user as any).user_metadata?.avatar_url,
        };
        setProfile(basicProfile);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      showToast('Failed to load profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async () => {
    if (!user || !profile) return;
    
    try {
      setSaving(true);
      
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: profile.email,
          full_name: profile.full_name,
          bio: profile.bio,
          location: profile.location,
          avatar_url: profile.avatar_url,
          updated_at: new Date().toISOString(),
        });
      
      if (error) throw error;
      
      showToast('Profile updated successfully! ✅', 'success');
      
      // Navigate back after successful save (wait for toast to show)
      setTimeout(() => {
        router.back();
      }, 2000);
    } catch (error) {
      console.error('Error updating profile:', error);
      showToast('Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please allow access to your photos to update your profile picture.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      showToast('Failed to select image', 'error');
    }
  };

  const uploadImage = async (uri: string) => {
    if (!user) return;
    
    try {
      setUploading(true);
      
      // Upload image to Supabase Storage
      const result = await uploadProfileImage(uri, user.id, {
        compress: true,
        maxWidth: 400,
        maxHeight: 400,
        quality: 0.8
      });
      
      if (result.success && result.url) {
        // Update profile with new image URL
        setProfile(prev => prev ? { ...prev, avatar_url: result.url } : null);
        
        // Also update in database immediately
        const { error } = await supabase
          .from('profiles')
          .update({ avatar_url: result.url })
          .eq('id', user.id);
        
        if (error) throw error;
        
        showToast('Profile picture updated successfully! ✅', 'success');
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      showToast('Failed to upload image', 'error');
    } finally {
      setUploading(false);
    }
  };

  const updateField = (field: keyof UserProfile, value: string) => {
    setProfile(prev => prev ? { ...prev, [field]: value } : null);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load profile</Text>
        <Button title="Retry" onPress={fetchProfile} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContainer}
        >
        {/* Profile Picture */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile Picture</Text>
          <View style={styles.avatarContainer}>
            <Image
              source={{ 
                uri: profile.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
              }}
              style={styles.avatar}
              contentFit="cover"
            />
            <Pressable 
              style={styles.cameraButton} 
              onPress={pickImage}
              disabled={uploading}
            >
              {uploading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Ionicons name="camera" size={20} color="white" />
              )}
            </Pressable>
          </View>
        </View>

        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          <Input
            label="Full Name"
            value={profile.full_name || ''}
            onChangeText={(text) => updateField('full_name', text)}
            placeholder="Enter your full name"
            leftIcon={<Ionicons name="person" size={20} color={Colors.textLight} />}
          />
          
          <Input
            label="Email"
            value={profile.email}
            onChangeText={(text) => updateField('email', text)}
            placeholder="Enter your email"
            keyboardType="email-address"
            autoCapitalize="none"
            leftIcon={<Ionicons name="mail" size={20} color={Colors.textLight} />}
            editable={false}
            containerStyle={styles.disabledInput}
          />
          
          <Input
            label="Location"
            value={profile.location || ''}
            onChangeText={(text) => updateField('location', text)}
            placeholder="Enter your address or location"
            leftIcon={<Ionicons name="location" size={20} color={Colors.textLight} />}
          />
        </View>

        {/* Bio */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About You</Text>
          <Input
            label="Bio"
            value={profile.bio || ''}
            onChangeText={(text) => updateField('bio', text)}
            placeholder="Tell others about yourself..."
            multiline
            numberOfLines={4}
            style={styles.bioInput}
            leftIcon={<Ionicons name="document-text" size={20} color={Colors.textLight} />}
          />
        </View>

        {/* Save Button */}
        <Button
          title="Save Changes"
          onPress={updateProfile}
          loading={saving}
          leftIcon={<Ionicons name="save" size={16} color="white" />}
          style={styles.saveButton}
        />
        </ScrollView>
      </TouchableWithoutFeedback>

      <ToastComponent />
    </KeyboardAvoidingView>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: Colors.danger,
    marginBottom: 20,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  scrollContainer: {
    paddingTop: 20,
    paddingBottom: 100,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.border,
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: '35%',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.card,
  },
  disabledInput: {
    opacity: 0.6,
  },
  bioInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  saveButton: {
    margin: 20,
  },
});