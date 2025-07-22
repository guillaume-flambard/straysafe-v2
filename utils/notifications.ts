import * as Notifications from 'expo-notifications';
import { supabase } from '@/lib/supabase';

// Notification types for different scenarios
export type NotificationType = 
  | 'new_message'
  | 'conversation_invite'
  | 'dog_discussion_update'
  | 'location_group_update';

interface BaseNotificationParams {
  type: NotificationType;
  recipientUserIds: string[];
  title: string;
  body: string;
  data?: Record<string, any>;
}

interface MessageNotificationParams extends BaseNotificationParams {
  type: 'new_message';
  conversationId: string;
  senderId: string;
  senderName: string;
}

interface ConversationNotificationParams extends BaseNotificationParams {
  type: 'conversation_invite';
  conversationId: string;
  inviterId: string;
  inviterName: string;
}

interface DogNotificationParams extends BaseNotificationParams {
  type: 'dog_discussion_update';
  conversationId: string;
  dogId: string;
  dogName: string;
}

interface LocationNotificationParams extends BaseNotificationParams {
  type: 'location_group_update';
  conversationId: string;
  locationId: string;
  locationName: string;
}

export type NotificationParams = 
  | MessageNotificationParams
  | ConversationNotificationParams
  | DogNotificationParams
  | LocationNotificationParams;

class NotificationService {
  private static instance: NotificationService;
  
  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // Send notification to multiple users
  async sendNotification(params: NotificationParams): Promise<void> {
    try {
      // Get push tokens for all recipients
      const { data: tokens, error } = await supabase
        .from('user_push_tokens')
        .select('user_id, push_token, platform')
        .in('user_id', params.recipientUserIds);

      if (error) throw error;
      if (!tokens || tokens.length === 0) {
        console.log('No push tokens found for recipients');
        return;
      }

      // Filter out users who have disabled notifications
      const { data: settings, error: settingsError } = await supabase
        .from('user_notification_settings')
        .select('user_id, messages_enabled, conversations_enabled, dogs_enabled, locations_enabled')
        .in('user_id', params.recipientUserIds);

      if (settingsError) {
        console.error('Error fetching notification settings:', settingsError);
      }

      // Create notification payloads
      const notifications = tokens
        .filter(token => this.shouldSendNotification(token.user_id, params.type, settings || []))
        .map(token => ({
          to: token.push_token,
          title: params.title,
          body: params.body,
          data: {
            type: params.type,
            userId: token.user_id,
            ...params.data,
          },
          sound: 'default',
          priority: 'high' as const,
          badge: 1,
        }));

      if (notifications.length === 0) {
        console.log('All recipients have disabled notifications for this type');
        return;
      }

      // Send notifications via Expo Push API
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notifications),
      });

      if (!response.ok) {
        throw new Error(`Push notification failed: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Push notifications sent:', result);

      // Store notification in database for history
      await this.storeNotificationHistory(params);

    } catch (error) {
      console.error('Error sending push notifications:', error);
    }
  }

  // Check if notification should be sent based on user settings
  private shouldSendNotification(
    userId: string, 
    type: NotificationType, 
    settings: any[]
  ): boolean {
    const userSettings = settings.find(s => s.user_id === userId);
    if (!userSettings) return true; // Default to enabled if no settings found

    switch (type) {
      case 'new_message':
        return userSettings.messages_enabled !== false;
      case 'conversation_invite':
        return userSettings.conversations_enabled !== false;
      case 'dog_discussion_update':
        return userSettings.dogs_enabled !== false;
      case 'location_group_update':
        return userSettings.locations_enabled !== false;
      default:
        return true;
    }
  }

  // Store notification in history table
  private async storeNotificationHistory(params: NotificationParams): Promise<void> {
    try {
      const notifications = params.recipientUserIds.map(userId => ({
        user_id: userId,
        type: params.type,
        title: params.title,
        body: params.body,
        data: params.data || {},
        sent_at: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from('notification_history')
        .insert(notifications);

      if (error) {
        console.error('Error storing notification history:', error);
      }
    } catch (error) {
      console.error('Error storing notification history:', error);
    }
  }

  // Send message notification
  async sendMessageNotification(params: {
    conversationId: string;
    senderId: string;
    senderName: string;
    message: string;
    recipientUserIds: string[];
    conversationTitle?: string;
  }): Promise<void> {
    const notificationParams: MessageNotificationParams = {
      type: 'new_message',
      recipientUserIds: params.recipientUserIds,
      title: params.conversationTitle || `Message from ${params.senderName}`,
      body: params.message.length > 100 
        ? params.message.substring(0, 97) + '...' 
        : params.message,
      data: {
        conversationId: params.conversationId,
        senderId: params.senderId,
        screen: 'chat',
      },
    };

    await this.sendNotification(notificationParams);
  }

  // Send conversation invite notification
  async sendConversationInvite(params: {
    conversationId: string;
    inviterId: string;
    inviterName: string;
    conversationTitle: string;
    recipientUserIds: string[];
  }): Promise<void> {
    const notificationParams: ConversationNotificationParams = {
      type: 'conversation_invite',
      recipientUserIds: params.recipientUserIds,
      title: 'New conversation invitation',
      body: `${params.inviterName} invited you to "${params.conversationTitle}"`,
      data: {
        conversationId: params.conversationId,
        inviterId: params.inviterId,
        screen: 'chat',
      },
    };

    await this.sendNotification(notificationParams);
  }

  // Send dog discussion update
  async sendDogDiscussionUpdate(params: {
    conversationId: string;
    dogId: string;
    dogName: string;
    updateType: 'new_discussion' | 'status_change' | 'new_message';
    recipientUserIds: string[];
  }): Promise<void> {
    const titles = {
      new_discussion: `New discussion about ${params.dogName}`,
      status_change: `${params.dogName}'s status updated`,
      new_message: `New message about ${params.dogName}`,
    };

    const bodies = {
      new_discussion: `A new discussion has started about ${params.dogName}`,
      status_change: `${params.dogName}'s status has been updated. Check the latest info.`,
      new_message: `Someone posted a new message in ${params.dogName}'s discussion`,
    };

    const notificationParams: DogNotificationParams = {
      type: 'dog_discussion_update',
      recipientUserIds: params.recipientUserIds,
      title: titles[params.updateType],
      body: bodies[params.updateType],
      data: {
        conversationId: params.conversationId,
        dogId: params.dogId,
        dogName: params.dogName,
        updateType: params.updateType,
        screen: 'chat',
      },
    };

    await this.sendNotification(notificationParams);
  }
}

// Export singleton instance
export const notificationService = NotificationService.getInstance();

// Utility functions
export const sendMessageNotification = (params: {
  conversationId: string;
  senderId: string;
  senderName: string;
  message: string;
  recipientUserIds: string[];
  conversationTitle?: string;
}) => notificationService.sendMessageNotification(params);

export const sendConversationInvite = (params: {
  conversationId: string;
  inviterId: string;
  inviterName: string;
  conversationTitle: string;
  recipientUserIds: string[];
}) => notificationService.sendConversationInvite(params);

export const sendDogDiscussionUpdate = (params: {
  conversationId: string;
  dogId: string;
  dogName: string;
  updateType: 'new_discussion' | 'status_change' | 'new_message';
  recipientUserIds: string[];
}) => notificationService.sendDogDiscussionUpdate(params);