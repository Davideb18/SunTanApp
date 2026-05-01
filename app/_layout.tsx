/**
 * Root Layout — app/_layout.tsx
 */
import React, { useEffect } from "react";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { setupNotifications } from "../utils/notifications";
import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import { Platform } from "react-native";
import "../global.css";

export default function RootLayout() {
  useEffect(() => {
    setupNotifications();
    
    // Configure RevenueCat
    Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.ERROR);

    const platformApiKey =
      Platform.OS === "ios"
        ? process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY
        : process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY;
    const testApiKey = process.env.EXPO_PUBLIC_REVENUECAT_TEST_API_KEY;
    const revenueCatApiKey = platformApiKey || testApiKey;

    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      if (revenueCatApiKey) {
        Purchases.configure({ apiKey: revenueCatApiKey });
      } else {
        console.warn("RevenueCat API key missing. Set EXPO_PUBLIC_REVENUECAT_IOS_API_KEY / EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY or EXPO_PUBLIC_REVENUECAT_TEST_API_KEY.");
      }
    }
  }, []);

  return (
    <GestureHandlerRootView className="flex-1">
      <SafeAreaProvider>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false, animation: "fade" }}>
          <Stack.Screen name="index" options={{ headerShown: false, animation: "fade" }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="onboarding"
            options={{
              headerShown: false,
              presentation: "modal",
              animation: "slide_from_bottom",
            }}
          />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
