import { useState, useEffect, useRef } from 'react';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { useAuth } from './auth-store';
import { supabase } from '@/lib/supabase';
import { showToast } from '@/utils/toast';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

interface NotificationState {
  expoPushToken: string | null;
  notification: Notifications.Notification | null;
  loading: boolean;
  error: string | null;
  permissions: {
    granted: boolean;
    canAskAgain: boolean;
  };
}

export function useNotifications() {
  const { user } = useAuth();
  const [state, setState] = useState<NotificationState>({
    expoPushToken: null,
    notification: null,
    loading: false,
    error: null,
    permissions: {
      granted: false,
      canAskAgain: true,
    }
  });

  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  // Register for push notifications
  const registerForPushNotifications = async (): Promise<string | null> => {
    let token = null;

    // Check if running in Expo Go
    const isExpoGo = Constants?.appOwnership === 'expo';
    if (isExpoGo) {
      // Silently fail in Expo Go without warning
      setState(prev => ({
        ...prev,
        error: 'Push notifications require a development build'
      }));
      return null;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('messages', {
        name: 'Message notifications',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
        sound: 'default',
        enableLights: true,
        enableVibrate: true,
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      setState(prev => ({
        ...prev,
        permissions: {
          granted: finalStatus === 'granted',
          canAskAgain: finalStatus !== 'denied',
        }
      }));

      if (finalStatus !== 'granted') {
        // Silently fail without toast in development
        return null;
      }
      
      try {
        const tokenData = await Notifications.getExpoPushTokenAsync();
        token = tokenData.data;
      } catch (error) {
        console.error('Error getting push token:', error);
        setState(prev => ({
          ...prev,
          error: 'Failed to get push token'
        }));
      }
    } else {
      // Silently handle simulator/emulator case
      console.log('Push notifications only work on physical devices');
    }

    return token;
  };

  // Store push token in database
  const storePushToken = async (token: string) => {
    if (!user || !token) return;

    try {
      const { error } = await supabase
        .from('user_push_tokens')
        .upsert({
          user_id: user.id,
          push_token: token,
          platform: Platform.OS,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,platform'
        });

      if (error) throw error;
      
      console.log('Push token stored successfully');
    } catch (error) {
      console.error('Error storing push token:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to store push token'
      }));
    }
  };

  // Initialize notifications
  const initializeNotifications = async () => {
    if (!user) return;
    
    // Prevent multiple initializations
    if (state.loading || state.expoPushToken) return;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const token = await registerForPushNotifications();
      
      if (token) {
        setState(prev => ({ ...prev, expoPushToken: token }));
        await storePushToken(token);
      }
    } catch (error) {
      console.error('Error initializing notifications:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to initialize notifications'
      }));
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  // Send push notification (for testing)
  const sendTestNotification = async () => {
    if (!state.expoPushToken) {
      showToast('No push token available', 'error');
      return;
    }

    try {
      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: state.expoPushToken,
          title: 'Test Notification 📱',
          body: 'This is a test notification from StraySafe!',
          data: { screen: 'messages' },
          sound: 'default',
          priority: 'high',
        }),
      });
      
      showToast('Test notification sent! 🚀', 'success');
    } catch (error) {
      console.error('Error sending test notification:', error);
      showToast('Failed to send test notification', 'error');
    }
  };

  // Send message notification
  const sendMessageNotification = async (params: {
    recipientUserId: string;
    senderName: string;
    message: string;
    conversationId: string;
    conversationTitle?: string;
  }) => {
    try {
      // Get recipient's push tokens
      const { data: tokens, error } = await supabase
        .from('user_push_tokens')
        .select('push_token, platform')
        .eq('user_id', params.recipientUserId);

      if (error) throw error;
      if (!tokens || tokens.length === 0) return;

      // Send notification to each device
      const notifications = tokens.map(token => ({
        to: token.push_token,
        title: params.conversationTitle || `Message from ${params.senderName}`,
        body: params.message.length > 100 
          ? params.message.substring(0, 97) + '...' 
          : params.message,
        data: { 
          screen: 'chat',
          conversationId: params.conversationId,
          senderId: user?.id,
        },
        sound: 'default',
        priority: 'high',
        badge: 1,
      }));

      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notifications),
      });

    } catch (error) {
      console.error('Error sending message notification:', error);
    }
  };

  // Clear all notifications
  const clearAllNotifications = async () => {
    try {
      await Notifications.dismissAllNotificationsAsync();
      await Notifications.setBadgeCountAsync(0);
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  };

  // Handle notification response (when user taps notification)
  const handleNotificationResponse = (response: Notifications.NotificationResponse) => {
    const data = response.notification.request.content.data;
    
    if (data?.screen === 'chat' && data?.conversationId) {
      // Navigation will be handled by the app component using this data
      setState(prev => ({ 
        ...prev, 
        notification: response.notification 
      }));
    }
  };

  // Setup notification listeners
  useEffect(() => {
    if (!user) return;

    // Initialize notifications
    initializeNotifications();

    // Listen for notifications received while app is running
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      setState(prev => ({ ...prev, notification }));
    });

    // Listen for notification responses (user taps notification)
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      handleNotificationResponse(response);
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [user]);

  return {
    // State
    expoPushToken: state.expoPushToken,
    notification: state.notification,
    loading: state.loading,
    error: state.error,
    permissions: state.permissions,
    
    // Actions
    initializeNotifications,
    sendTestNotification,
    sendMessageNotification,
    clearAllNotifications,
    
    // Utils
    hasPermissions: () => state.permissions.granted,
    canRequestPermissions: () => state.permissions.canAskAgain,
  };
}