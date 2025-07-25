import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAdminNotifications, type AdminNotification } from '@/hooks/admin-notifications-store';
import { Colors } from '@/constants/colors';

interface AdminNotificationItemProps {
  notification: AdminNotification;
  onMarkAsRead: (id: string) => void;
}

const AdminNotificationItem: React.FC<AdminNotificationItemProps> = ({
  notification,
  onMarkAsRead,
}) => {
  const handlePress = () => {
    if (!notification.isRead) {
      onMarkAsRead(notification.id);
    }
    
    // Navigate to dog profile
    router.push(`/dog/${notification.dogId}`);
  };

  const handleContactUser = () => {
    // Navigate to messaging with the user
    router.push(`/messages?userId=${notification.userId}`);
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'new_interest':
        return 'heart';
      case 'interest_update':
        return 'refresh';
      case 'adoption_inquiry':
        return 'home';
      default:
        return 'notifications';
    }
  };

  const getIconColor = () => {
    switch (notification.type) {
      case 'new_interest':
        return '#E91E63';
      case 'interest_update':
        return '#FF9800';
      case 'adoption_inquiry':
        return '#4CAF50';
      default:
        return Colors.primary;
    }
  };

  const getInterestTypeColor = () => {
    if (!notification.interest) return Colors.textSecondary;
    
    switch (notification.interest.type) {
      case 'adoption':
        return '#E91E63';
      case 'fostering':
        return '#FF9800';
      case 'sponsoring':
        return '#9C27B0';
      case 'volunteering':
        return '#4CAF50';
      default:
        return Colors.textSecondary;
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <TouchableOpacity 
      style={[
        styles.notificationItem,
        !notification.isRead && styles.unreadNotification
      ]}
      onPress={handlePress}
    >
      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <View style={[styles.iconContainer, { backgroundColor: getIconColor() + '20' }]}>
            <Ionicons 
              name={getIcon() as any} 
              size={20} 
              color={getIconColor()} 
            />
          </View>
          
          <View style={styles.textContainer}>
            <View style={styles.titleRow}>
              <Text style={styles.notificationTitle} numberOfLines={1}>
                {notification.title}
              </Text>
              {notification.interest && (
                <View style={[
                  styles.interestBadge, 
                  { backgroundColor: getInterestTypeColor() }
                ]}>
                  <Text style={styles.interestBadgeText}>
                    {notification.interest.type}
                  </Text>
                </View>
              )}
            </View>
            
            <Text style={styles.notificationMessage} numberOfLines={2}>
              {notification.message}
            </Text>
            
            <View style={styles.metaRow}>
              <View style={styles.dogInfo}>
                {notification.dog.mainImage ? (
                  <Image 
                    source={{ uri: notification.dog.mainImage }}
                    style={styles.dogImage}
                  />
                ) : (
                  <View style={styles.dogImagePlaceholder}>
                    <Ionicons name="paw" size={12} color={Colors.textSecondary} />
                  </View>
                )}
                <Text style={styles.dogName}>{notification.dog.name}</Text>
              </View>
              
              <View style={styles.userInfo}>
                {notification.user.avatar ? (
                  <Image 
                    source={{ uri: notification.user.avatar }}
                    style={styles.userAvatar}
                  />
                ) : (
                  <View style={styles.userAvatarPlaceholder}>
                    <Ionicons name="person" size={12} color={Colors.textSecondary} />
                  </View>
                )}
                <Text style={styles.userName}>{notification.user.name}</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.metaContainer}>
            <Text style={styles.timeText}>
              {formatTime(notification.createdAt)}
            </Text>
            {!notification.isRead && (
              <View style={styles.unreadDot} />
            )}
          </View>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleContactUser}
          >
            <Ionicons name="chatbubble-outline" size={16} color={Colors.primary} />
            <Text style={styles.actionButtonText}>Contact</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handlePress}
          >
            <Ionicons name="eye-outline" size={16} color={Colors.primary} />
            <Text style={styles.actionButtonText}>View Dog</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export const AdminNotificationsList: React.FC = () => {
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    isAdmin,
    refresh,
  } = useAdminNotifications();

  if (!isAdmin) {
    return (
      <View style={styles.noAccessContainer}>
        <Ionicons name="shield-outline" size={48} color={Colors.textSecondary} />
        <Text style={styles.noAccessText}>Access Denied</Text>
        <Text style={styles.noAccessSubtext}>
          You need admin or volunteer permissions to view this page
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          Admin Notifications {unreadCount > 0 && `(${unreadCount})`}
        </Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllAsRead} style={styles.markAllButton}>
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="notifications-outline" size={48} color={Colors.textSecondary} />
            <Text style={styles.emptyStateText}>No admin notifications</Text>
            <Text style={styles.emptyStateSubtext}>
              You'll receive notifications when users express interest in dogs
            </Text>
          </View>
        ) : (
          notifications.map((notification) => (
            <AdminNotificationItem
              key={notification.id}
              notification={notification}
              onMarkAsRead={markAsRead}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  markAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  markAllText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  notificationItem: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  unreadNotification: {
    backgroundColor: '#f8f9ff',
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    marginRight: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
    marginRight: 8,
  },
  interestBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  interestBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  notificationMessage: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dogInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dogImage: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 6,
  },
  dogImagePlaceholder: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  dogName: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
  },
  userAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 6,
  },
  userAvatarPlaceholder: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  userName: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  metaContainer: {
    alignItems: 'flex-end',
  },
  timeText: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginLeft: 8,
    backgroundColor: Colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionButtonText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '500',
    marginLeft: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  noAccessContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    backgroundColor: Colors.background,
  },
  noAccessText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: 16,
    marginBottom: 8,
  },
  noAccessSubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});