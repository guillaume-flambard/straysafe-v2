import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, Switch, Alert, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Shield, Eye, Lock, Trash2, Users, MapPin, EyeOff } from 'lucide-react-native';
import { useAuth } from '@/hooks/auth-store';
import { supabase } from '@/lib/supabase';
import Colors from '@/constants/colors';
import Button from '@/components/Button';
import { showToast, ToastComponent } from '@/utils/toast';

interface PrivacySettings {
  profile_visibility: boolean;
  location_sharing: boolean;
  activity_status: boolean;
  search_visibility: boolean;
  data_analytics: boolean;
}

export default function PrivacyScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [settings, setSettings] = useState<PrivacySettings>({
    profile_visibility: true,
    location_sharing: true,
    activity_status: true,
    search_visibility: true,
    data_analytics: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPrivacySettings();
  }, [user]);

  const loadPrivacySettings = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('user_privacy_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      if (data) {
        setSettings({
          profile_visibility: data.profile_visibility,
          location_sharing: data.location_sharing,
          activity_status: data.activity_status,
          search_visibility: data.search_visibility,
          data_analytics: data.data_analytics,
        });
      }
    } catch (error) {
      console.error('Error loading privacy settings:', error);
      showToast('Failed to load privacy settings', 'warning');
    } finally {
      setLoading(false);
    }
  };

  const savePrivacySettings = async () => {
    if (!user) return;

    try {
      setSaving(true);
      
      const { error } = await supabase
        .from('user_privacy_settings')
        .upsert({
          user_id: user.id,
          ...settings,
          updated_at: new Date().toISOString(),
        });
      
      if (error) throw error;
      
      showToast('Privacy settings saved! 🔒', 'success');
    } catch (error) {
      console.error('Error saving privacy settings:', error);
      showToast('Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: keyof PrivacySettings, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const PrivacyOption = ({ 
    icon, 
    title, 
    description, 
    value, 
    onValueChange,
    color = Colors.primary 
  }: {
    icon: React.ReactNode;
    title: string;
    description: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
    color?: string;
  }) => (
    <View style={styles.optionContainer}>
      <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
        {icon}
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.optionTitle}>{title}</Text>
        <Text style={styles.optionDescription}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: Colors.border, true: Colors.primary + '40' }}
        thumbColor={value ? Colors.primary : Colors.textLight}
      />
    </View>
  );

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            Alert.alert('Account Deletion', 'Account deletion functionality will be available soon.');
          }
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading privacy settings...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Privacy & Security</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile Privacy</Text>
          
          <PrivacyOption
            icon={<Eye size={20} color={Colors.primary} />}
            title="Profile Visibility"
            description="Make your profile visible to other users"
            value={settings.profile_visibility}
            onValueChange={(value) => updateSetting('profile_visibility', value)}
          />
          
          <PrivacyOption
            icon={<Users size={20} color={Colors.secondary} />}
            title="Search Visibility"
            description="Allow others to find you in search results"
            value={settings.search_visibility}
            onValueChange={(value) => updateSetting('search_visibility', value)}
            color={Colors.secondary}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location & Activity</Text>
          
          <PrivacyOption
            icon={<MapPin size={20} color={Colors.success} />}
            title="Location Sharing"
            description="Share your location with other users"
            value={settings.location_sharing}
            onValueChange={(value) => updateSetting('location_sharing', value)}
            color={Colors.success}
          />
          
          <PrivacyOption
            icon={<Shield size={20} color={Colors.warning} />}
            title="Activity Status"
            description="Show when you're active or last seen"
            value={settings.activity_status}
            onValueChange={(value) => updateSetting('activity_status', value)}
            color={Colors.warning}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data & Analytics</Text>
          
          <PrivacyOption
            icon={<Lock size={20} color={Colors.textLight} />}
            title="Analytics"
            description="Help us improve the app with usage analytics"
            value={settings.data_analytics}
            onValueChange={(value) => updateSetting('data_analytics', value)}
            color={Colors.textLight}
          />
        </View>

        <Button
          title="Save Privacy Settings"
          onPress={savePrivacySettings}
          loading={saving}
          style={styles.saveButton}
        />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Management</Text>
          
          <Button
            title="Export My Data"
            onPress={() => Alert.alert('Export Data', 'Data export functionality will be available soon.')}
            variant="outline"
            style={styles.dataButton}
            fullWidth
          />
          
          <Button
            title="Delete Account"
            onPress={handleDeleteAccount}
            variant="danger"
            style={styles.deleteButton}
            leftIcon={<Trash2 size={18} color="white" />}
            fullWidth
          />
        </View>

      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>Data Protection</Text>
        <Text style={styles.infoText}>
          We take your privacy seriously. Your personal information is encrypted and stored securely. 
          We never share your data with third parties without your explicit consent.
        </Text>
      </View>
      </ScrollView>

      <ToastComponent />
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
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
    marginBottom: 16,
  },
  optionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    color: Colors.text,
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: 12,
    color: Colors.textLight,
  },
  dataButton: {
    marginBottom: 12,
  },
  deleteButton: {
    marginTop: 8,
  },
  saveButton: {
    margin: 20,
  },
  infoSection: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
});