import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthContext } from "@/hooks/auth-store";
import { DogsContext } from "@/hooks/dogs-store";
import NotificationProvider from "@/components/NotificationProvider";
import { trpc, trpcClient } from "@/lib/trpc";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ 
      headerBackTitle: "Back",
      headerStyle: {
        backgroundColor: '#ffffff',
      },
      headerTintColor: '#3498db',
      headerTitleStyle: {
        fontWeight: '600',
      },
    }}>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="dog/[id]" options={{ title: "Dog Profile" }} />
      <Stack.Screen name="chat/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="new-conversation" options={{ headerShown: false }} />
      <Stack.Screen name="notification-settings" options={{ headerShown: false }} />
      <Stack.Screen name="notification-test" options={{ title: "Notification Test" }} />
      <Stack.Screen name="test-users" options={{ title: "Test Users" }} />
      <Stack.Screen name="settings" options={{ headerShown: true }} />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <AuthContext>
            <DogsContext>
              <NotificationProvider>
                <RootLayoutNav />
              </NotificationProvider>
            </DogsContext>
          </AuthContext>
        </GestureHandlerRootView>
      </QueryClientProvider>
    </trpc.Provider>
  );
}