import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/auth-store';
import Colors from '@/constants/colors';
import Button from '@/components/Button';
import { 
  TEST_USERS, 
  createTestUser, 
  testLogin, 
  setupAllTestUsers,
  testPermissions 
} from '@/utils/test-permissions';
import { UserPlus, LogIn, Settings, Users, CheckCircle, XCircle } from 'lucide-react-native';

export default function TestUsersScreen() {
  const router = useRouter();
  const { user: currentUser, signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const handleCreateTestUser = async (testUser: typeof TEST_USERS[0]) => {
    setLoading(true);
    try {
      const result = await createTestUser(testUser);
      
      if (result.success) {
        Alert.alert(
          'Success',
          `Test user created: ${testUser.email}\nRole: ${testUser.role}`
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to create test user');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to create test user');
    } finally {
      setLoading(false);
    }
  };

  const handleTestLogin = async (testUser: typeof TEST_USERS[0]) => {
    setLoading(true);
    try {
      // Sign out current user first
      if (currentUser) {
        await signOut();
      }

      const result = await testLogin(testUser.email, testUser.password);
      
      if (result.success) {
        const permissions = await testPermissions(result.role);
        Alert.alert(
          'Login Success',
          `Logged in as: ${testUser.email}\nRole: ${result.role}\n\nPermissions:\n${Object.entries(permissions)
            .filter(([_, value]) => value)
            .map(([key]) => `• ${key}`)
            .join('\n') || '• View only'}`
        );
        
        // Navigate back to main app
        router.push('/(tabs)');
      } else {
        Alert.alert('Login Failed', result.error || 'Failed to login');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to test login');
    } finally {
      setLoading(false);
    }
  };

  const handleSetupAllUsers = async () => {
    setLoading(true);
    try {
      const results = await setupAllTestUsers();
      setResults(results);
      
      const successCount = results.filter(r => r.success).length;
      const failCount = results.length - successCount;
      
      Alert.alert(
        'Setup Complete',
        `Created: ${successCount} users\nFailed: ${failCount} users\n\nCheck console for details.`
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to setup test users');
    } finally {
      setLoading(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return Colors.danger;
      case 'volunteer': return Colors.primary;
      case 'vet': return Colors.success;
      case 'viewer': return Colors.textLight;
      default: return Colors.textLight;
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return '👑';
      case 'volunteer': return '🤝';
      case 'vet': return '🩺';
      case 'viewer': return '👁️';
      default: return '👤';
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Users size={32} color={Colors.primary} />
        <Text style={styles.title}>Test Users Manager</Text>
        <Text style={styles.subtitle}>Create and test different user roles</Text>
      </View>

      {currentUser && (
        <View style={styles.currentUserCard}>
          <Text style={styles.currentUserTitle}>Current User</Text>
          <Text style={styles.currentUserEmail}>{currentUser.email}</Text>
          <Button
            title="Sign Out"
            onPress={signOut}
            variant="outline"
            style={styles.signOutButton}
          />
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Setup</Text>
        <Button
          title="Create All Test Users"
          onPress={handleSetupAllUsers}
          loading={loading}
          leftIcon={<UserPlus size={16} color="white" />}
          style={styles.setupButton}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Individual Test Users</Text>
        
        {TEST_USERS.map((testUser, index) => (
          <View key={index} style={styles.userCard}>
            <View style={styles.userInfo}>
              <View style={styles.userHeader}>
                <Text style={styles.userRole}>
                  {getRoleIcon(testUser.role)} {testUser.role.toUpperCase()}
                </Text>
                <View style={[styles.roleBadge, { backgroundColor: getRoleColor(testUser.role) }]}>
                  <Text style={styles.roleBadgeText}>{testUser.role}</Text>
                </View>
              </View>
              <Text style={styles.userName}>{testUser.name}</Text>
              <Text style={styles.userEmail}>{testUser.email}</Text>
              <Text style={styles.userPassword}>Password: {testUser.password}</Text>
            </View>
            
            <View style={styles.userActions}>
              <Button
                title="Create"
                onPress={() => handleCreateTestUser(testUser)}
                variant="outline"
                style={styles.actionButton}
                leftIcon={<UserPlus size={14} color={Colors.primary} />}
                disabled={loading}
              />
              <Button
                title="Login"
                onPress={() => handleTestLogin(testUser)}
                style={styles.actionButton}
                leftIcon={<LogIn size={14} color="white" />}
                disabled={loading}
              />
            </View>
          </View>
        ))}
      </View>

      {results.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Setup Results</Text>
          {results.map((result, index) => (
            <View key={index} style={styles.resultCard}>
              <View style={styles.resultHeader}>
                {result.success ? (
                  <CheckCircle size={20} color={Colors.success} />
                ) : (
                  <XCircle size={20} color={Colors.danger} />
                )}
                <Text style={styles.resultEmail}>{result.email}</Text>
              </View>
              {!result.success && result.error && (
                <Text style={styles.resultError}>{result.error}</Text>
              )}
            </View>
          ))}
        </View>
      )}

      <Button
        title="Back to App"
        onPress={() => router.back()}
        variant="outline"
        style={styles.backButton}
      />
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
  currentUserCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  currentUserTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  currentUserEmail: {
    fontSize: 14,
    color: Colors.textLight,
    marginBottom: 12,
  },
  signOutButton: {
    paddingVertical: 8,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  setupButton: {
    marginBottom: 8,
  },
  userCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  userInfo: {
    marginBottom: 12,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  userRole: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  roleBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  roleBadgeText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
  },
  userName: {
    fontSize: 16,
    color: Colors.text,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: Colors.textLight,
    marginBottom: 2,
  },
  userPassword: {
    fontSize: 12,
    color: Colors.textLight,
    fontFamily: 'monospace',
  },
  userActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
  },
  resultCard: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  resultEmail: {
    fontSize: 14,
    color: Colors.text,
  },
  resultError: {
    fontSize: 12,
    color: Colors.danger,
    marginTop: 4,
  },
  backButton: {
    marginTop: 16,
  },
});