import { Tabs } from "expo-router";
import React from "react";
import { useAuth } from "@/hooks/auth-store";
import { useOnboarding } from "@/hooks/onboarding-store";
import OnboardingScreen from "@/components/OnboardingScreen";
import Colors from "@/constants/colors";
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  const authState = useAuth();
  const { shouldShowOnboarding, completeOnboarding, loading: onboardingLoading } = useOnboarding();

  console.log('TabLayout: authState', authState ? 'exists' : 'null');

  // Safety check - ensure auth context is available
  if (!authState) {
    console.log('TabLayout: No authState, returning null');
    return null;
  }

  const { user, initialized } = authState;

  console.log('TabLayout:', { initialized, user: user ? 'exists' : 'null', shouldShowOnboarding });

  // Don't render tabs if not authenticated or still loading
  if (!initialized || !user) {
    console.log('TabLayout: Not initialized or no user, returning null');
    return null;
  }

  // Show onboarding if user hasn't completed it
  if (shouldShowOnboarding && !onboardingLoading) {
    console.log('TabLayout: Showing onboarding');
    return <OnboardingScreen onComplete={completeOnboarding} />;
  }

  console.log('TabLayout: Rendering tabs');

  return (
    <Tabs
      screenOptions={{
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
          fontWeight: '500',
          marginBottom: 8,
        },
        headerStyle: {
          backgroundColor: Colors.card,
        },
        headerTintColor: Colors.text,
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dogs",
          tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} />,
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
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => <Ionicons name="person" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}