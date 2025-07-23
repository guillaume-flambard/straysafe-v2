import React from 'react';
import { StyleSheet, Text, View, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useNotifications } from '@/hooks/notifications-store';
import { useAuth } from '@/hooks/auth-store';
import Colors from '@/constants/colors';
import Button from '@/components/Button';
import { Bell, Send, Settings, CheckCircle } from 'lucide-react-native';

export default function NotificationTestScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { 
    expoPushToken, 
    loading, 
    error, 
    permissions,
    sendTestNotification,
    initializeNotifications,
    hasPermissions,
    canRequestPermissions
  } = useNotifications();

  const handleRequestPermissions = async () => {
    if (canRequestPermissions()) {
      await initializeNotifications();
    } else {
      Alert.alert(
        'Permissions Required',
        'Please enable notifications in your device settings to receive push notifications.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => {
            // In a real app, you'd open system settings
            Alert.alert('Info', 'Please go to Settings > Notifications > StraySafe to enable notifications');
          }}
        ]
      );
    }
  };

  const getStatusColor = () => {
    if (hasPermissions() && expoPushToken) return Colors.success;
    if (error) return Colors.danger;
    return Colors.warning;
  };

  const getStatusText = () => {
    if (loading) return 'Initializing...';
    if (error) return `Error: ${error}`;
    if (hasPermissions() && expoPushToken) return 'Ready';
    if (!hasPermissions()) return 'Permissions needed';
    return 'Not configured';
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Bell size={32} color={Colors.primary} />
        <Text style={styles.title}>Push Notifications Test</Text>
        <Text style={styles.subtitle}>Test and configure push notifications</Text>
      </View>

      {/* Status Card */}
      <View style={styles.statusCard}>
        <View style={styles.statusHeader}>
          <Text style={styles.statusTitle}>Notification Status</Text>
          <View style={[styles.statusIndicator, { backgroundColor: getStatusColor() }]} />
        </View>
        
        <Text style={[styles.statusText, { color: getStatusColor() }]}>
          {getStatusText()}
        </Text>

        {user && (
          <View style={styles.userInfo}>
            <Text style={styles.userInfoLabel}>User ID:</Text>
            <Text style={styles.userInfoValue}>{user.id}</Text>
          </View>
        )}

        {expoPushToken && (
          <View style={styles.tokenInfo}>
            <Text style={styles.tokenLabel}>Push Token:</Text>
            <Text style={styles.tokenValue} numberOfLines={2}>
              {expoPushToken.substring(0, 50)}...
            </Text>
          </View>
        )}
      </View>

      {/* Permissions Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Permissions</Text>
        
        <View style={styles.permissionItem}>
          <Text style={styles.permissionLabel}>Notifications Granted:</Text>
          <View style={styles.permissionStatus}>
            {hasPermissions() ? (
              <CheckCircle size={20} color={Colors.success} />
            ) : (
              <Text style={[styles.permissionText, { color: Colors.danger }]}>
                Not Granted
              </Text>
            )}
          </View>
        </View>

        <View style={styles.permissionItem}>
          <Text style={styles.permissionLabel}>Can Request Again:</Text>
          <Text style={[
            styles.permissionText, 
            { color: canRequestPermissions() ? Colors.success : Colors.danger }
          ]}>
            {canRequestPermissions() ? 'Yes' : 'No'}
          </Text>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actionsCard}>
        <Text style={styles.cardTitle}>Actions</Text>

        {!hasPermissions() && (
          <Button
            title="Request Permissions"
            onPress={handleRequestPermissions}
            leftIcon={<Settings size={16} color="white" />}
            style={styles.actionButton}
            disabled={loading}
          />
        )}

        {!expoPushToken && hasPermissions() && (
          <Button
            title="Initialize Notifications"
            onPress={initializeNotifications}
            leftIcon={<Bell size={16} color="white" />}
            style={styles.actionButton}
            loading={loading}
          />
        )}

        {expoPushToken && hasPermissions() && (
          <Button
            title="Send Test Notification"
            onPress={sendTestNotification}
            leftIcon={<Send size={16} color="white" />}
            style={styles.actionButton}
          />
        )}

        <Button
          title="Go Back"
          onPress={() => router.back()}
          variant="outline"
          style={styles.actionButton}
        />
      </View>

      {/* Debug Info */}
      {__DEV__ && (
        <View style={styles.debugCard}>
          <Text style={styles.cardTitle}>Debug Info</Text>
          <Text style={styles.debugText}>
            {JSON.stringify({
              hasPermissions: hasPermissions(),
              canRequestPermissions: canRequestPermissions(),
              hasToken: !!expoPushToken,
              loading,
              error: error || 'none'
            }, null, 2)}
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  contentContainer: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 12,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textLight,
    textAlign: 'center',
    marginTop: 4,
  },
  statusCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
  },
  userInfo: {
    marginBottom: 8,
  },
  userInfoLabel: {
    fontSize: 12,
    color: Colors.textLight,
    marginBottom: 2,
  },
  userInfoValue: {
    fontSize: 14,
    color: Colors.text,
    fontFamily: 'monospace',
  },
  tokenInfo: {
    marginTop: 8,
  },
  tokenLabel: {
    fontSize: 12,
    color: Colors.textLight,
    marginBottom: 4,
  },
  tokenValue: {
    fontSize: 12,
    color: Colors.text,
    fontFamily: 'monospace',
    backgroundColor: Colors.background,
    padding: 8,
    borderRadius: 6,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  permissionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  permissionLabel: {
    fontSize: 14,
    color: Colors.text,
  },
  permissionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  permissionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  actionsCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  actionButton: {
    marginBottom: 12,
  },
  debugCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
  },
  debugText: {
    fontSize: 12,
    color: Colors.textLight,
    fontFamily: 'monospace',
  },
});