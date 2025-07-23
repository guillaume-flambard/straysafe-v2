import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Image, ScrollView, Alert, Pressable, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '@/hooks/auth-store';
import { supabase } from '@/lib/supabase';
import { resetOnboardingForUser } from '@/utils/onboarding';
import Colors from '@/constants/colors';
import Button from '@/components/Button';
import { Ionicons } from '@expo/vector-icons';
import { showToast, ToastComponent } from '@/utils/toast';

interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  location?: string;
  bio?: string;
  phone?: string;
  created_at: string;
}

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  
  if (!user) return null;

  useEffect(() => {
    fetchUserProfile();
  }, [user]);

  // Refresh profile when screen comes into focus (e.g., coming back from settings)
  useFocusEffect(
    React.useCallback(() => {
      if (user) {
        fetchUserProfile();
      }
    }, [user])
  );

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }
      
      if (data) {
        setProfile(data);
      } else {
        // Create a basic profile if none exists
        const basicProfile = {
          id: user.id,
          email: user.email || '',
          full_name: (user as any).user_metadata?.full_name,
          avatar_url: (user as any).user_metadata?.avatar_url,
          created_at: new Date().toISOString()
        };
        setProfile(basicProfile);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      showToast('Failed to load profile', 'error');
      // Fallback to auth user data
      const fallbackProfile = {
        id: user.id,
        email: user.email || '',
        full_name: (user as any).user_metadata?.full_name,
        avatar_url: (user as any).user_metadata?.avatar_url,
        created_at: new Date().toISOString()
      };
      setProfile(fallbackProfile);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          onPress: async () => {
            await signOut();
          },
        },
      ]
    );
  };

  const ProfileOption = ({ 
    icon, 
    title, 
    subtitle,
    color = Colors.primary,
    onPress
  }: { 
    icon: React.ReactNode; 
    title: string; 
    subtitle?: string;
    color?: string;
    onPress?: () => void;
  }) => (
    <Pressable 
      style={({ pressed }) => [
        styles.optionContainer,
        pressed && styles.optionPressed
      ]}
      onPress={onPress}
    >
      <View style={[styles.optionIconContainer, { backgroundColor: color + '20' }]}>
        {icon}
      </View>
      <View style={styles.optionTextContainer}>
        <Text style={styles.optionTitle}>{title}</Text>
        {subtitle && <Text style={styles.optionSubtitle}>{subtitle}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={20} color={Colors.textLight} />
    </Pressable>
  );

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
        <Button title="Retry" onPress={fetchUserProfile} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
          <View style={styles.header}>
            <Image 
              source={{ 
                uri: profile.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80' 
              }} 
              style={styles.avatar} 
            />
            <View style={styles.userInfo}>
              <Text style={styles.name}>{profile.full_name || 'No name set'}</Text>
              <Text style={styles.email}>{profile.email}</Text>
              {profile.bio && (
                <Text style={styles.bio} numberOfLines={2}>{profile.bio}</Text>
              )}
              {profile.location && (
                <View style={styles.locationDisplay}>
                  <Ionicons name="location" size={14} color={Colors.textLight} />
                  <Text style={styles.locationDisplayText}>{profile.location}</Text>
                </View>
              )}
              <View style={styles.roleBadge}>
                <Text style={styles.roleText}>Member</Text>
              </View>
            </View>
          </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <ProfileOption 
          icon={<Ionicons name="settings" size={20} color={Colors.primary} />} 
          title="Account Settings" 
          subtitle="Update your profile information" 
          onPress={() => router.push('/settings/account')}
        />
        <ProfileOption 
          icon={<Ionicons name="notifications" size={20} color={Colors.secondary} />} 
          title="Notifications" 
          subtitle="Manage your notification preferences" 
          color={Colors.secondary}
          onPress={() => router.push('/notification-settings')}
        />
        <ProfileOption 
          icon={<Ionicons name="shield" size={20} color={Colors.success} />} 
          title="Privacy & Security" 
          subtitle="Control your data and security settings" 
          color={Colors.success}
          onPress={() => router.push('/settings/privacy')}
        />
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support</Text>
        <ProfileOption 
          icon={<Ionicons name="help-circle" size={20} color={Colors.textLight} />} 
          title="Help & Support" 
          subtitle="Get help with using the app" 
          color={Colors.textLight}
          onPress={() => router.push('/settings/help')}
        />
        {__DEV__ && (
          <>
            <ProfileOption 
              icon={<Ionicons name="notifications" size={20} color={Colors.warning} />} 
              title="Test Notifications" 
              subtitle="Test push notification functionality" 
              color={Colors.warning}
              onPress={() => router.push('/notification-test')}
            />
            <ProfileOption 
              icon={<Ionicons name="help-circle" size={20} color={Colors.secondary} />} 
              title="Reset Onboarding" 
              subtitle="Show onboarding tutorial again" 
              color={Colors.secondary}
              onPress={async () => {
                if (user) {
                  const success = await resetOnboardingForUser(user.id);
                  if (success) {
                    showToast('Onboarding reset! Restart the app to see it again.', 'success');
                  } else {
                    showToast('Failed to reset onboarding', 'error');
                  }
                }
              }}
            />
            <ProfileOption 
              icon={<Ionicons name="person" size={20} color={Colors.success} />} 
              title="Test Users Manager" 
              subtitle="Create and test different user roles" 
              color={Colors.success}
              onPress={() => router.push('/test-users')}
            />
          </>
        )}
      </View>
      
      <Button
        title="Sign Out"
        onPress={handleSignOut}
        variant="outline"
        style={styles.signOutButton}
        fullWidth
        leftIcon={<Ionicons name="log-out" size={18} color={Colors.primary} />}
      />
      
      <Text style={styles.version}>StraySafe v1.0.0</Text>
      
      <ToastComponent />
    </ScrollView>
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
  contentContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
  },
  userInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: Colors.textLight,
    marginBottom: 8,
  },
  bio: {
    fontSize: 12,
    color: Colors.textLight,
    lineHeight: 16,
    marginBottom: 8,
  },
  roleBadge: {
    backgroundColor: Colors.primary + '20',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  roleText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '500',
  },
  section: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
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
  },
  optionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  optionPressed: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    marginHorizontal: -8,
    paddingHorizontal: 8,
  },
  optionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    color: Colors.text,
    marginBottom: 2,
  },
  optionSubtitle: {
    fontSize: 12,
    color: Colors.textLight,
  },
  signOutButton: {
    marginBottom: 20,
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    color: Colors.textLight,
  },
  locationDisplay: {
    flexDirection: 'row', 
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 8,
  },
  locationDisplayText: {
    fontSize: 12,
    color: Colors.textLight,
    marginLeft: 6,
  },
});