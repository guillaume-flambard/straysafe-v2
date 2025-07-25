import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from './auth-store';
import { InterestType } from '@/types';

export interface AdminNotification {
  id: string;
  type: 'new_interest' | 'interest_update' | 'adoption_inquiry';
  title: string;
  message: string;
  dogId: string;
  userId: string;
  interestId?: string;
  isRead: boolean;
  createdAt: string;
  dog: {
    id: string;
    name: string;
    mainImage?: string;
    status: string;
  };
  user: {
    id: string;
    name: string;
    avatar?: string;
    email?: string;
  };
  interest?: {
    id: string;
    type: InterestType;
    message?: string;
    status: string;
  };
}

export const useAdminNotifications = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const isAdmin = user?.role === 'admin' || user?.role === 'volunteer';

  // Fetch admin notifications
  const notificationsQuery = useQuery({
    queryKey: ['admin-notifications'],
    queryFn: async () => {
      if (!isAdmin) return [];

      const { data, error } = await supabase
        .from('admin_notifications')
        .select(`
          *,
          dog:dogs(id, name, main_image, status),
          user:profiles!admin_notifications_user_id_fkey(id, full_name, avatar_url, email),
          interest:dog_interests(id, type, message, status)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error fetching admin notifications:', error);
        throw error;
      }

      return (data || []).map(notification => ({
        id: notification.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        dogId: notification.dog_id,
        userId: notification.user_id,
        interestId: notification.interest_id,
        isRead: notification.is_read,
        createdAt: notification.created_at,
        dog: {
          id: notification.dog.id,
          name: notification.dog.name,
          mainImage: notification.dog.main_image,
          status: notification.dog.status,
        },
        user: {
          id: notification.user.id,
          name: notification.user.full_name || 'Unknown User',
          avatar: notification.user.avatar_url,
          email: notification.user.email,
        },
        interest: notification.interest ? {
          id: notification.interest.id,
          type: notification.interest.type,
          message: notification.interest.message,
          status: notification.interest.status,
        } : undefined,
      })) as AdminNotification[];
    },
    enabled: isAdmin,
    staleTime: 30000,
  });

  // Get unread count
  const unreadCountQuery = useQuery({
    queryKey: ['admin-notifications-unread-count'],
    queryFn: async () => {
      if (!isAdmin) return 0;

      const { count, error } = await supabase
        .from('admin_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('is_read', false);

      if (error) {
        console.error('Error fetching admin unread count:', error);
        return 0;
      }

      return count || 0;
    },
    enabled: isAdmin,
    staleTime: 30000,
  });

  // Mark notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('admin_notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['admin-notifications-unread-count'] });
    },
  });

  // Mark all notifications as read
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('admin_notifications')
        .update({ is_read: true })
        .eq('is_read', false);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['admin-notifications-unread-count'] });
    },
  });

  // Create notification for new interest
  const createInterestNotificationMutation = useMutation({
    mutationFn: async (params: {
      dogId: string;
      userId: string;
      interestId: string;
      interestType: InterestType;
      dogName: string;
      userName: string;
    }) => {
      const { error } = await supabase
        .from('admin_notifications')
        .insert({
          type: 'new_interest',
          title: `New ${params.interestType} interest`,
          message: `${params.userName} is interested in ${params.interestType} ${params.dogName}`,
          dog_id: params.dogId,
          user_id: params.userId,
          interest_id: params.interestId,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['admin-notifications-unread-count'] });
    },
  });

  const markAsRead = (notificationId: string) => {
    markAsReadMutation.mutate(notificationId);
  };

  const markAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const createInterestNotification = (params: {
    dogId: string;
    userId: string;
    interestId: string;
    interestType: InterestType;
    dogName: string;
    userName: string;
  }) => {
    createInterestNotificationMutation.mutate(params);
  };

  return {
    notifications: notificationsQuery.data || [],
    unreadCount: unreadCountQuery.data || 0,
    isLoading: notificationsQuery.isLoading || unreadCountQuery.isLoading,
    error: notificationsQuery.error || unreadCountQuery.error,
    markAsRead,
    markAllAsRead,
    createInterestNotification,
    isAdmin,
    refresh: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['admin-notifications-unread-count'] });
    },
  };
};