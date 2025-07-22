import { Stack } from 'expo-router';
import React from 'react';
import Colors from '@/constants/colors';

export default function SettingsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.card,
        },
        headerTintColor: Colors.text,
        headerTitleStyle: {
          fontWeight: '600',
        },
        headerBackTitle: 'Back',
      }}
    >
      <Stack.Screen name="account" options={{ title: 'Account Settings' }} />
      <Stack.Screen name="notifications" options={{ title: 'Notifications' }} />
      <Stack.Screen name="privacy" options={{ title: 'Privacy & Security' }} />
      <Stack.Screen name="location" options={{ title: 'Location Settings' }} />
      <Stack.Screen name="help" options={{ title: 'Help & Support' }} />
    </Stack>
  );
}