import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Switch, Alert } from 'react-native';
import Colors from '@/constants/colors';
import Button from '@/components/Button';
import { Shield, Eye, Lock, Trash2 } from 'lucide-react-native';

export default function PrivacyScreen() {
  const [profileVisible, setProfileVisible] = useState(true);
  const [dataSharing, setDataSharing] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);

  const PrivacyOption = ({ 
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

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            Alert.alert('Account Deletion', 'Account deletion functionality will be available soon.');
          }
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Privacy Settings</Text>
        
        <PrivacyOption
          icon={<Eye size={20} color={Colors.primary} />}
          title="Profile Visibility"
          description="Make your profile visible to other users"
          value={profileVisible}
          onValueChange={setProfileVisible}
        />
        
        <PrivacyOption
          icon={<Shield size={20} color={Colors.secondary} />}
          title="Data Sharing"
          description="Share anonymized data to improve the service"
          value={dataSharing}
          onValueChange={setDataSharing}
          color={Colors.secondary}
        />
        
        <PrivacyOption
          icon={<Lock size={20} color={Colors.success} />}
          title="Analytics"
          description="Help us improve the app with usage analytics"
          value={analyticsEnabled}
          onValueChange={setAnalyticsEnabled}
          color={Colors.success}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data Management</Text>
        
        <Button
          title="Export My Data"
          onPress={() => Alert.alert('Export Data', 'Data export functionality will be available soon.')}
          variant="outline"
          style={styles.dataButton}
          fullWidth
        />
        
        <Button
          title="Delete Account"
          onPress={handleDeleteAccount}
          variant="danger"
          style={styles.deleteButton}
          leftIcon={<Trash2 size={18} color="white" />}
          fullWidth
        />
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>Data Protection</Text>
        <Text style={styles.infoText}>
          We take your privacy seriously. Your personal information is encrypted and stored securely. 
          We never share your data with third parties without your explicit consent.
        </Text>
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
  dataButton: {
    marginBottom: 12,
  },
  deleteButton: {
    marginTop: 8,
  },
  infoSection: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
});