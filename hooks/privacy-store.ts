import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './auth-store';

export interface PrivacySettings {
  profile_visibility: boolean;
  location_sharing: boolean;
  activity_status: boolean;
  search_visibility: boolean;
  data_analytics: boolean;
}

const DEFAULT_PRIVACY_SETTINGS: PrivacySettings = {
  profile_visibility: true,
  location_sharing: true,
  activity_status: true,
  search_visibility: true,
  data_analytics: true,
};

export function usePrivacy() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<PrivacySettings>(DEFAULT_PRIVACY_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load privacy settings
  const loadPrivacySettings = async () => {
    if (!user) {
      setSettings(DEFAULT_PRIVACY_SETTINGS);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('user_privacy_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      if (data) {
        setSettings({
          profile_visibility: data.profile_visibility,
          location_sharing: data.location_sharing,
          activity_status: data.activity_status,
          search_visibility: data.search_visibility,
          data_analytics: data.data_analytics,
        });
      } else {
        // Create default settings for new user
        await createDefaultSettings();
      }
    } catch (err) {
      console.error('Error loading privacy settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to load privacy settings');
      setSettings(DEFAULT_PRIVACY_SETTINGS);
    } finally {
      setLoading(false);
    }
  };

  // Create default privacy settings for new user
  const createDefaultSettings = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_privacy_settings')
        .insert({
          user_id: user.id,
          ...DEFAULT_PRIVACY_SETTINGS,
        });

      if (error) throw error;
      setSettings(DEFAULT_PRIVACY_SETTINGS);
    } catch (err) {
      console.error('Error creating default privacy settings:', err);
    }
  };

  // Update privacy settings
  const updatePrivacySettings = async (newSettings: Partial<PrivacySettings>) => {
    if (!user) return false;

    try {
      const updatedSettings = { ...settings, ...newSettings };

      const { error } = await supabase
        .from('user_privacy_settings')
        .upsert({
          user_id: user.id,
          ...updatedSettings,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      setSettings(updatedSettings);
      return true;
    } catch (err) {
      console.error('Error updating privacy settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to update privacy settings');
      return false;
    }
  };

  // Check if a user's profile should be visible based on privacy settings
  const isProfileVisible = (userId: string, userPrivacySettings?: PrivacySettings) => {
    if (!userPrivacySettings) return true; // Default to visible if no settings
    return userPrivacySettings.profile_visibility;
  };

  // Check if location sharing is enabled
  const isLocationSharingEnabled = (userId: string, userPrivacySettings?: PrivacySettings) => {
    if (!userPrivacySettings) return true;
    return userPrivacySettings.location_sharing;
  };

  // Check if user should appear in search results
  const isSearchVisible = (userId: string, userPrivacySettings?: PrivacySettings) => {
    if (!userPrivacySettings) return true;
    return userPrivacySettings.search_visibility;
  };

  // Check if activity status should be shown
  const isActivityStatusVisible = (userId: string, userPrivacySettings?: PrivacySettings) => {
    if (!userPrivacySettings) return true;
    return userPrivacySettings.activity_status;
  };

  // Get privacy settings for a specific user (for other components to check visibility)
  const getUserPrivacySettings = async (userId: string): Promise<PrivacySettings | null> => {
    try {
      const { data, error } = await supabase
        .from('user_privacy_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error || !data) return null;

      return {
        profile_visibility: data.profile_visibility,
        location_sharing: data.location_sharing,
        activity_status: data.activity_status,
        search_visibility: data.search_visibility,
        data_analytics: data.data_analytics,
      };
    } catch (err) {
      console.error('Error fetching user privacy settings:', err);
      return null;
    }
  };

  // Load settings when user changes
  useEffect(() => {
    loadPrivacySettings();
  }, [user]);

  return {
    // State
    settings,
    loading,
    error,

    // Actions
    loadPrivacySettings,
    updatePrivacySettings,
    createDefaultSettings,

    // Utility functions
    isProfileVisible,
    isLocationSharingEnabled,
    isSearchVisible,
    isActivityStatusVisible,
    getUserPrivacySettings,

    // Current user's privacy checks
    canShareLocation: settings.location_sharing,
    isProfilePublic: settings.profile_visibility,
    showActivityStatus: settings.activity_status,
    allowSearch: settings.search_visibility,
    allowAnalytics: settings.data_analytics,
  };
}