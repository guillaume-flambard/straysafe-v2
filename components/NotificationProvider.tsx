import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useNotifications } from '@/hooks/notifications-store';
import { useAuth } from '@/hooks/auth-store';

export default function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();
  const { 
    notification, 
    initializeNotifications, 
    hasPermissions,
    expoPushToken 
  } = useNotifications();

  // Initialize notifications when user is available (once per user)
  useEffect(() => {
    if (user && !expoPushToken) {
      // Only initialize once per user session
      const initOnce = async () => {
        await initializeNotifications();
      };
      initOnce();
    }
  }, [user?.id]); // Only depend on user.id to prevent loops

  // Handle notification navigation when user taps notification
  useEffect(() => {
    if (!notification) return;

    const data = notification.request.content.data;
    console.log('📱 Notification tapped:', data);

    // Navigate to the appropriate screen based on notification data
    if (data?.screen === 'chat' && data?.conversationId) {
      console.log(`🎯 Navigating to chat: ${data.conversationId}`);
      router.push(`/chat/${data.conversationId}`);
    } else if (data?.screen === 'dog' && data?.dogId) {
      console.log(`🐕 Navigating to dog profile: ${data.dogId}`);
      router.push(`/dog/${data.dogId}`);
    }
  }, [notification, router]);

  // Remove notification debug logs to clean console

  return <>{children}</>;
}