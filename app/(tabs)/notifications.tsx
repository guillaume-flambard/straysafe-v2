import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/auth-store';
import { useDogNotifications } from '@/hooks/dog-notifications-store';
import { useAdminNotifications } from '@/hooks/admin-notifications-store';
import { NotificationsList } from '@/components/NotificationsList';
import { AdminNotificationsList } from '@/components/AdminNotificationsList';
import { ModerationPanel } from '@/components/ModerationPanel';
import { Colors } from '@/constants/colors';

export default function NotificationsScreen() {
  const { user } = useAuth();
  const { unreadCount: userUnreadCount } = useDogNotifications();
  const { unreadCount: adminUnreadCount, isAdmin } = useAdminNotifications();
  
  const [activeTab, setActiveTab] = useState<'user' | 'admin' | 'moderation'>('user');

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Please log in to view notifications</Text>
      </View>
    );
  }

  const tabs = [
    {
      key: 'user' as const,
      title: 'My Notifications',
      icon: 'notifications',
      count: userUnreadCount,
      available: true,
    },
    {
      key: 'admin' as const,
      title: 'Admin Alerts',
      icon: 'shield',
      count: adminUnreadCount,
      available: isAdmin,
    },
    {
      key: 'moderation' as const,
      title: 'Moderation',
      icon: 'hammer',
      count: 0,
      available: isAdmin,
    },
  ];

  const availableTabs = tabs.filter(tab => tab.available);

  const renderTabBar = () => (
    <View style={styles.tabBar}>
      {availableTabs.map((tab) => (
        <TouchableOpacity
          key={tab.key}
          style={[
            styles.tab,
            activeTab === tab.key && styles.activeTab,
          ]}
          onPress={() => setActiveTab(tab.key)}
        >
          <View style={styles.tabContent}>
            <Ionicons
              name={tab.icon as any}
              size={20}
              color={activeTab === tab.key ? Colors.primary : Colors.textSecondary}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === tab.key && styles.activeTabText,
              ]}
            >
              {tab.title}
            </Text>
            {tab.count > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{tab.count}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'user':
        return <NotificationsList />;
      case 'admin':
        return <AdminNotificationsList />;
      case 'moderation':
        return <ModerationPanel />;
      default:
        return <NotificationsList />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {availableTabs.length > 1 && renderTabBar()}
      <View style={styles.content}>
        {renderContent()}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingHorizontal: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
  },
  tabContent: {
    alignItems: 'center',
    position: 'relative',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  activeTabText: {
    color: Colors.primary,
    fontWeight: '600',
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -12,
    backgroundColor: '#FF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  errorText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 50,
  },
});