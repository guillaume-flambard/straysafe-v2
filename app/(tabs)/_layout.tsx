import { Tabs } from "expo-router";
import React from "react";
import { useAuth } from "@/hooks/auth-store";
import Colors from "@/constants/colors";
import * as Lucide from "lucide-react-native";

export default function TabLayout() {
  const authState = useAuth();

  // Safety check - ensure auth context is available
  if (!authState) {
    return null;
  }

  const { user, initialized } = authState;

  // Don't render tabs if not authenticated or still loading
  if (!initialized || !user) {
    return null;
  }

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
          tabBarIcon: ({ color }) => <Lucide.Home size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: "Map",
          tabBarIcon: ({ color }) => <Lucide.Map size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: "Add Dog",
          tabBarIcon: ({ color }) => <Lucide.Plus size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: "Messages",
          tabBarIcon: ({ color }) => <Lucide.MessageCircle size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => <Lucide.User size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}