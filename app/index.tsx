import { useEffect } from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '@/hooks/auth-store';
import { View, ActivityIndicator } from 'react-native';
import Colors from '@/constants/colors';

export default function Index() {
  const authState = useAuth();

  // Safety check - ensure auth context is available
  if (!authState) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const { initialized, user, session } = authState;

  // Show loading while checking auth state OR while profile is loading
  if (!initialized) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  // Redirect based on auth state
  console.log('Index: Redirecting...', { 
    user: user ? 'exists' : 'null', 
    session: session ? 'exists' : 'null' 
  });
  
  if (user) {
    console.log('Index: Redirecting to tabs');
    return <Redirect href="/(tabs)" />;
  } else if (session) {
    // User has auth session but auth store is still loading/creating profile
    // Show loading while auth store processes the session
    console.log('Index: User has session, waiting for profile to load...');
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  } else {
    console.log('Index: Redirecting to login');
    return <Redirect href="/(auth)/login" />;
  }
}