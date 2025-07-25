import { Tabs } from "expo-router";
import React, { useMemo } from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import { useAuth } from "@/hooks/auth-store";
import { useOnboarding } from "@/hooks/onboarding-store";
import { useDogNotifications } from "@/hooks/dog-notifications-store";
import { useAdminNotifications } from "@/hooks/admin-notifications-store";
import OnboardingScreen from "@/components/OnboardingScreen";
import Colors from "@/constants/colors";
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  const authState = useAuth();
  const { shouldShowOnboarding, completeOnboarding, loading: onboardingLoading } = useOnboarding();
  const { unreadCount: userNotifications } = useDogNotifications();
  const { unreadCount: adminNotifications } = useAdminNotifications();

  console.log('TabLayout: authState', authState ? 'exists' : 'null');

  // Safety check - ensure auth context is available
  if (!authState) {
    console.log('TabLayout: No authState, returning null');
    return null;
  }

  const { user, initialized } = authState;

  // Memoize conditions to prevent unnecessary re-renders
  const shouldRenderTabs = useMemo(() => {
    return initialized && user;
  }, [initialized, user]);

  const shouldRenderOnboarding = useMemo(() => {
    return shouldShowOnboarding && !onboardingLoading;
  }, [shouldShowOnboarding, onboardingLoading]);

  console.log('TabLayout:', { initialized, user: user ? 'exists' : 'null', shouldShowOnboarding });

  // Don't render tabs if not authenticated or still loading
  if (!shouldRenderTabs) {
    console.log('TabLayout: Not initialized or no user, returning null');
    return null;
  }

  // Show onboarding if user hasn't completed it
  if (shouldRenderOnboarding) {
    console.log('TabLayout: Showing onboarding');
    return <OnboardingScreen onComplete={completeOnboarding} />;
  }

  console.log('TabLayout: Rendering tabs');

  const totalNotifications = userNotifications + adminNotifications;

  const NotificationBadge = ({ count }: { count: number }) => {
    if (count === 0) return null;
    return (
      <View style={badgeStyles.badge}>
        <Text style={badgeStyles.badgeText}>{count > 99 ? '99+' : count}</Text>
      </View>
    );
  };

  const CustomHeader = ({ title }: { title: string }) => {
    return (
      <View style={headerStyles.container}>
        <Image 
          source={require('@/assets/images/straysafe_logo.png')}
          style={headerStyles.logo}
        />
        <Text style={headerStyles.title}>{title}</Text>
      </View>
    );
  };

  const screenOptions = useMemo(() => ({
    tabBarActiveTintColor: Colors.primary,
    tabBarInactiveTintColor: Colors.textLight,
    tabBarStyle: {
      borderTopColor: Colors.border,
      paddingBottom: 12,
      paddingTop: 8,
      height: 80,
    },
    tabBarLabelStyle: {
      fontSize: 12,
      fontWeight: '500' as const,
      marginBottom: 8,
    },
    headerStyle: {
      backgroundColor: Colors.card,
    },
    headerTintColor: Colors.text,
    headerTitleStyle: {
      fontWeight: '600' as const,
    },
  }), []);

  return (
    <Tabs screenOptions={screenOptions}>
      <Tabs.Screen
        name="index"
        options={{
          title: "Dogs",
          tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} />,
          headerTitle: () => <CustomHeader title="StraySafe" />,
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: "Map",
          tabBarIcon: ({ color }) => <Ionicons name="map" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: "Add Dog",
          tabBarIcon: ({ color }) => <Ionicons name="add" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: "Messages",
          tabBarIcon: ({ color }) => <Ionicons name="chatbubble" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: "Notifications",
          tabBarIcon: ({ color }) => (
            <View style={{ position: 'relative' }}>
              <Ionicons name="notifications" size={24} color={color} />
              <NotificationBadge count={totalNotifications} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => <Ionicons name="person" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}

const badgeStyles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
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
});

const headerStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 28,
    height: 28,
    marginRight: 8,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
  },
});