/**
 * Root Layout — app/_layout.tsx
 *
 * Bootstraps the navigation tree inside GestureHandlerRootView +
 * SafeAreaProvider. Imports global.css so NativeWind compiles
 * Tailwind classes throughout the app.
 *
 * ⚠️  Do NOT wrap the Stack in React Navigation's ThemeProvider —
 *     it breaks Expo Router's context propagation in RN v7.
 */
import React from "react";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import "../global.css";

export default function RootLayout() {
  return (
    <GestureHandlerRootView className="flex-1">
      <SafeAreaProvider>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false, animation: "fade" }}>
          {/* Splash screen - Entry point */}
          <Stack.Screen name="index" options={{ headerShown: false, animation: "fade" }} />
          {/* Main tab navigator — no header */}
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          {/* Onboarding shown as a full-screen modal */}
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
