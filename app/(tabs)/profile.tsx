import React from 'react';
import { StyleSheet, Text, View, Image, ScrollView, Alert, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/auth-store';
import Colors from '@/constants/colors';
import Button from '@/components/Button';
import { mockLocations } from '@/mocks/data';
import { LogOut, Settings, HelpCircle, Bell, Shield, MapPin, ChevronRight } from 'lucide-react-native';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  
  if (!user) return null;
  
  const userLocation = mockLocations.find(loc => loc.id === user.locationId);
  
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
      <ChevronRight size={20} color={Colors.textLight} />
    </Pressable>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Image 
          source={{ uri: user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80' }} 
          style={styles.avatar} 
        />
        <View style={styles.userInfo}>
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.email}>{user.email}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{user.role.charAt(0).toUpperCase() + user.role.slice(1)}</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <ProfileOption 
          icon={<Settings size={20} color={Colors.primary} />} 
          title="Account Settings" 
          subtitle="Update your profile information" 
          onPress={() => router.push('/settings/account')}
        />
        <ProfileOption 
          icon={<Bell size={20} color={Colors.secondary} />} 
          title="Notifications" 
          subtitle="Manage your notification preferences" 
          color={Colors.secondary}
          onPress={() => router.push('/settings/notifications')}
        />
        <ProfileOption 
          icon={<Shield size={20} color={Colors.success} />} 
          title="Privacy & Security" 
          subtitle="Control your data and security settings" 
          color={Colors.success}
          onPress={() => router.push('/settings/privacy')}
        />
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Location</Text>
        <ProfileOption 
          icon={<MapPin size={20} color={Colors.danger} />} 
          title={userLocation?.name || 'Unknown Location'} 
          subtitle={userLocation?.description} 
          color={Colors.danger}
          onPress={() => router.push('/settings/location')}
        />
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support</Text>
        <ProfileOption 
          icon={<HelpCircle size={20} color={Colors.textLight} />} 
          title="Help & Support" 
          subtitle="Get help with using the app" 
          color={Colors.textLight}
          onPress={() => router.push('/settings/help')}
        />
      </View>
      
      <Button
        title="Sign Out"
        onPress={handleSignOut}
        variant="outline"
        style={styles.signOutButton}
        fullWidth
        leftIcon={<LogOut size={18} color={Colors.primary} />}
      />
      
      <Text style={styles.version}>StraySafe v1.0.0</Text>
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
});