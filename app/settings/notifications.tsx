import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Switch } from 'react-native';
import Colors from '@/constants/colors';
import { Ionicons } from '@expo/vector-icons';

export default function NotificationsScreen() {
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [dogUpdates, setDogUpdates] = useState(true);
  const [locationAlerts, setLocationAlerts] = useState(true);
  const [adoptionNews, setAdoptionNews] = useState(true);

  const NotificationOption = ({ 
    icon, 
    title, 
    description, 
    value, 
    onValueChange,
    color = Colors.primary 
  }: {
    icon: React.ReactNode;
    title: string;
    description: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
    color?: string;
  }) => (
    <View style={styles.optionContainer}>
      <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
        {icon}
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.optionTitle}>{title}</Text>
        <Text style={styles.optionDescription}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: Colors.border, true: Colors.primary + '40' }}
        thumbColor={value ? Colors.primary : Colors.textLight}
      />
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>General Notifications</Text>
        
        <NotificationOption
          icon={<Ionicons name="notifications" size={20} color={Colors.primary} />}
          title="Push Notifications"
          description="Receive notifications on your device"
          value={pushNotifications}
          onValueChange={setPushNotifications}
        />
        
        <NotificationOption
          icon={<Ionicons name="chatbubble" size={20} color={Colors.secondary} />}
          title="Email Notifications"
          description="Receive updates via email"
          value={emailNotifications}
          onValueChange={setEmailNotifications}
          color={Colors.secondary}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Dog Updates</Text>
        
        <NotificationOption
          icon={<Ionicons name="heart" size={20} color={Colors.danger} />}
          title="Dog Status Changes"
          description="Get notified when a dog's status changes"
          value={dogUpdates}
          onValueChange={setDogUpdates}
          color={Colors.danger}
        />
        
        <NotificationOption
          icon={<Ionicons name="location" size={20} color={Colors.warning} />}
          title="Location Alerts"
          description="Notifications for dogs in your area"
          value={locationAlerts}
          onValueChange={setLocationAlerts}
          color={Colors.warning}
        />
        
        <NotificationOption
          icon={<Ionicons name="heart" size={20} color={Colors.success} />}
          title="Adoption News"
          description="Updates about successful adoptions"
          value={adoptionNews}
          onValueChange={setAdoptionNews}
          color={Colors.success}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  contentContainer: {
    padding: 16,
  },
  section: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  optionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    color: Colors.text,
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: 12,
    color: Colors.textLight,
  },
});