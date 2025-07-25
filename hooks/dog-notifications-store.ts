import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from './auth-store';

export interface DogNotification {
  id: string;
  userId: string;
  type: 'dog_status_change' | 'dog_event' | 'dog_comment' | 'adoption_update';
  title: string;
  message: string;
  dogId?: string;
  eventId?: string;
  commentId?: string;
  isRead: boolean;
  createdAt: string;
  dog?: {
    id: string;
    name: string;
    mainImage?: string;
  };
}

export const useDogNotifications = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch notifications for current user
  const notificationsQuery = useQuery({
    queryKey: ['dog-notifications', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('notifications')
        .select(`
          *,
          dog:dogs(id, name, main_image)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching dog notifications:', error);
        throw error;
      }

      return (data || []).map(notification => ({
        id: notification.id,
        userId: notification.user_id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        dogId: notification.dog_id,
        eventId: notification.event_id,
        commentId: notification.comment_id,
        isRead: notification.is_read,
        createdAt: notification.created_at,
        dog: notification.dog ? {
          id: notification.dog.id,
          name: notification.dog.name,
          mainImage: notification.dog.main_image,
        } : undefined,
      })) as DogNotification[];
    },
    enabled: !!user,
    staleTime: 30000,
  });

  // Get unread count
  const unreadCountQuery = useQuery({
    queryKey: ['dog-notifications-unread-count', user?.id],
    queryFn: async () => {
      if (!user) return 0;

      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) {
        console.error('Error fetching unread count:', error);
        return 0;
      }

      return count || 0;
    },
    enabled: !!user,
    staleTime: 30000,
  });

  // Mark notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dog-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['dog-notifications-unread-count'] });
    },
  });

  // Mark all notifications as read
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dog-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['dog-notifications-unread-count'] });
    },
  });

  // Delete notification
  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dog-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['dog-notifications-unread-count'] });
    },
  });

  const markAsRead = (notificationId: string) => {
    markAsReadMutation.mutate(notificationId);
  };

  const markAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const deleteNotification = (notificationId: string) => {
    deleteNotificationMutation.mutate(notificationId);
  };

  return {
    notifications: notificationsQuery.data || [],
    unreadCount: unreadCountQuery.data || 0,
    isLoading: notificationsQuery.isLoading || unreadCountQuery.isLoading,
    error: notificationsQuery.error || unreadCountQuery.error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh: () => {
      queryClient.invalidateQueries({ queryKey: ['dog-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['dog-notifications-unread-count'] });
    },
  };
};