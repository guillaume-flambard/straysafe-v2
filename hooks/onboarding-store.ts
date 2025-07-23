import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './auth-store';

const ONBOARDING_KEY = 'straysafe_onboarding_completed';

export function useOnboarding() {
  const { user } = useAuth();
  const [isOnboardingCompleted, setIsOnboardingCompleted] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  // Load onboarding status
  const loadOnboardingStatus = async () => {
    try {
      setLoading(true);
      
      if (!user) {
        setIsOnboardingCompleted(null);
        setLoading(false);
        return;
      }

      // Use user-specific key to track onboarding per user
      const userOnboardingKey = `${ONBOARDING_KEY}_${user.id}`;
      const completed = await AsyncStorage.getItem(userOnboardingKey);
      
      setIsOnboardingCompleted(completed === 'true');
    } catch (error) {
      console.error('Error loading onboarding status:', error);
      setIsOnboardingCompleted(false);
    } finally {
      setLoading(false);
    }
  };

  // Mark onboarding as completed
  const completeOnboarding = async () => {
    try {
      if (!user) return;

      const userOnboardingKey = `${ONBOARDING_KEY}_${user.id}`;
      await AsyncStorage.setItem(userOnboardingKey, 'true');
      setIsOnboardingCompleted(true);
      
      console.log('Onboarding completed for user:', user.id);
    } catch (error) {
      console.error('Error saving onboarding status:', error);
    }
  };

  // Reset onboarding (for testing purposes)
  const resetOnboarding = async () => {
    try {
      if (!user) return;

      const userOnboardingKey = `${ONBOARDING_KEY}_${user.id}`;
      await AsyncStorage.removeItem(userOnboardingKey);
      setIsOnboardingCompleted(false);
      
      console.log('Onboarding reset for user:', user.id);
    } catch (error) {
      console.error('Error resetting onboarding status:', error);
    }
  };

  // Check if we should show onboarding
  const shouldShowOnboarding = () => {
    // Show onboarding if user is logged in but hasn't completed it
    return user && isOnboardingCompleted === false;
  };

  // Load status when user changes
  useEffect(() => {
    loadOnboardingStatus();
  }, [user]);

  return {
    // State
    isOnboardingCompleted,
    loading,
    shouldShowOnboarding: shouldShowOnboarding(),

    // Actions
    completeOnboarding,
    resetOnboarding,
    loadOnboardingStatus,
  };
}