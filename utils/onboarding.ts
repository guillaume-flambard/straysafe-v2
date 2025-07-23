import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_KEY = 'straysafe_onboarding_completed';

// Reset onboarding for current user
export const resetOnboardingForUser = async (userId: string) => {
  try {
    const userOnboardingKey = `${ONBOARDING_KEY}_${userId}`;
    await AsyncStorage.removeItem(userOnboardingKey);
    console.log('Onboarding reset for user:', userId);
    return true;
  } catch (error) {
    console.error('Error resetting onboarding:', error);
    return false;
  }
};

// Check if user has completed onboarding
export const hasCompletedOnboarding = async (userId: string): Promise<boolean> => {
  try {
    const userOnboardingKey = `${ONBOARDING_KEY}_${userId}`;
    const completed = await AsyncStorage.getItem(userOnboardingKey);
    return completed === 'true';
  } catch (error) {
    console.error('Error checking onboarding status:', error);
    return false;
  }
};

// Mark onboarding as completed
export const markOnboardingCompleted = async (userId: string) => {
  try {
    const userOnboardingKey = `${ONBOARDING_KEY}_${userId}`;
    await AsyncStorage.setItem(userOnboardingKey, 'true');
    console.log('Onboarding completed for user:', userId);
    return true;
  } catch (error) {
    console.error('Error marking onboarding as completed:', error);
    return false;
  }
};