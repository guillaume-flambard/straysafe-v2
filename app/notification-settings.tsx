import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, Switch, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useNotifications } from '@/hooks/notifications-store';
import { useAuth } from '@/hooks/auth-store';
import { supabase } from '@/lib/supabase';
import Colors from '@/constants/colors';
import Button from '@/components/Button';
import { showToast, ToastComponent } from '@/utils/toast';

interface NotificationSettings {
  messages_enabled: boolean;
  conversations_enabled: boolean;
  dogs_enabled: boolean;
  locations_enabled: boolean;
  sound_enabled: boolean;
  vibration_enabled: boolean;
}

export default function NotificationSettingsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { 
    hasPermissions, 
    canRequestPermissions, 
    initializeNotifications,
    sendTestNotification,
    loading: notificationsLoading 
  } = useNotifications();

  const [settings, setSettings] = useState<NotificationSettings>({
    messages_enabled: true,
    conversations_enabled: true,
    dogs_enabled: true,
    locations_enabled: true,
    sound_enabled: true,
    vibration_enabled: true,
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, [user]);

  const loadSettings = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('user_notification_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }
      
      if (data) {
        setSettings({
          messages_enabled: data.messages_enabled,
          conversations_enabled: data.conversations_enabled,
          dogs_enabled: data.dogs_enabled,
          locations_enabled: data.locations_enabled,
          sound_enabled: data.sound_enabled,
          vibration_enabled: data.vibration_enabled,
        });
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
      showToast('Failed to load notification settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!user) return;

    try {
      setSaving(true);
      
      const { error } = await supabase
        .from('user_notification_settings')
        .upsert({
          user_id: user.id,
          ...settings,
          updated_at: new Date().toISOString(),
        });
      
      if (error) throw error;
      
      showToast('Notification settings saved! ✅', 'success');
    } catch (error) {
      console.error('Error saving notification settings:', error);
      showToast('Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: keyof NotificationSettings, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const requestPermissions = async () => {
    if (!canRequestPermissions()) {
      Alert.alert(
        'Notifications Disabled',
        'You have disabled notifications for this app. Please enable them in your device settings.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    await initializeNotifications();
  };

  const SettingItem = ({ 
    icon, 
    title, 
    subtitle, 
    setting, 
    disabled = false 
  }: {
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    setting: keyof NotificationSettings;
    disabled?: boolean;
  }) => (
    <View style={[styles.settingItem, disabled && styles.settingItemDisabled]}>
      <View style={styles.settingIcon}>
        {icon}
      </View>
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, disabled && styles.disabledText]}>
          {title}
        </Text>
        <Text style={[styles.settingSubtitle, disabled && styles.disabledText]}>
          {subtitle}
        </Text>
      </View>
      <Switch
        value={settings[setting]}
        onValueChange={(value) => updateSetting(setting, value)}
        disabled={disabled}
        trackColor={{ false: Colors.border, true: Colors.primary + '40' }}
        thumbColor={settings[setting] ? Colors.primary : Colors.textLight}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Notification Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Permission Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Permission Status</Text>
          
          <View style={[
            styles.permissionCard,
            hasPermissions() ? styles.permissionCardEnabled : styles.permissionCardDisabled
          ]}>
            <Ionicons name="notifications" 
              size={24} 
              color={hasPermissions() ? Colors.success : Colors.warning} 
            />
            <View style={styles.permissionContent}>
              <Text style={styles.permissionTitle}>
                {hasPermissions() ? 'Notifications Enabled' : 'Notifications Disabled'}
              </Text>
              <Text style={styles.permissionSubtitle}>
                {hasPermissions() 
                  ? 'You will receive push notifications for new messages'
                  : 'Enable notifications to receive message alerts'
                }
              </Text>
            </View>
            {!hasPermissions() && (
              <Button
                title="Enable"
                onPress={requestPermissions}
                size="small"
                variant="outline"
                loading={notificationsLoading}
              />
            )}
          </View>
        </View>

        {/* Notification Types */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notification Types</Text>
          
          <SettingItem
            icon={<Ionicons name="chatbubble-outline" size={20} color={Colors.secondary} />}
            title="Messages"
            subtitle="Get notified when you receive new messages"
            setting="messages_enabled"
            disabled={!hasPermissions()}
          />
          
          <SettingItem
            icon={<Ionicons name="people" size={20} color={Colors.primary} />}
            title="Conversations"
            subtitle="Get notified about conversation invites and updates"
            setting="conversations_enabled"
            disabled={!hasPermissions()}
          />
          
          <SettingItem
            icon={<Ionicons name="paw" size={20} color={Colors.primary} />}
            title="Dog Discussions"
            subtitle="Get notified about discussions for dogs you're following"
            setting="dogs_enabled"
            disabled={!hasPermissions()}
          />
          
          <SettingItem
            icon={<Ionicons name="location" size={20} color={Colors.success} />}
            title="Location Groups"
            subtitle="Get notified about activity in your location groups"
            setting="locations_enabled"
            disabled={!hasPermissions()}
          />
        </View>

        {/* Sound & Vibration */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sound & Vibration</Text>
          
          <SettingItem
            icon={<Ionicons name="volume-high" size={20} color={Colors.textLight} />}
            title="Sound"
            subtitle="Play notification sound"
            setting="sound_enabled"
            disabled={!hasPermissions()}
          />
          
          <SettingItem
            icon={<Ionicons name="phone-portrait" size={20} color={Colors.textLight} />}
            title="Vibration"
            subtitle="Vibrate on new notifications"
            setting="vibration_enabled"
            disabled={!hasPermissions()}
          />
        </View>

        {/* Test Notification */}
        {hasPermissions() && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Test</Text>
            
            <Button
              title="Send Test Notification"
              onPress={sendTestNotification}
              variant="outline"
              leftIcon={<Ionicons name="notifications" size={16} color={Colors.primary} />}
            />
          </View>
        )}

        {/* Save Button */}
        <View style={styles.section}>
          <Button
            title="Save Settings"
            onPress={saveSettings}
            loading={saving}
            disabled={loading}
          />
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
  permissionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  permissionCardEnabled: {
    backgroundColor: Colors.success + '10',
    borderColor: Colors.success + '30',
  },
  permissionCardDisabled: {
    backgroundColor: Colors.warning + '10',
    borderColor: Colors.warning + '30',
  },
  permissionContent: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  permissionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  permissionSubtitle: {
    fontSize: 14,
    color: Colors.textLight,
    lineHeight: 18,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  settingItemDisabled: {
    opacity: 0.5,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 4,
  },
  settingSubtitle: {
    fontSize: 14,
    color: Colors.textLight,
    lineHeight: 18,
  },
  disabledText: {
    opacity: 0.5,
  },
});