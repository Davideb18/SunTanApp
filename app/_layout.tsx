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
import Constants from "expo-constants";
import { useAppStore } from "../store/useAppStore";
import { PremiumModal } from "@/components/PremiumModal";
import { AmbassadorModal } from "@/components/AmbassadorModal";
import "../global.css";

export default function RootLayout() {
  const premiumVisible = useAppStore((s) => s.premiumVisible);
  const setPremiumVisible = useAppStore((s) => s.setPremiumVisible);
  const ambassadorVisible = useAppStore((s) => s.ambassadorVisible);
  const setAmbassadorVisible = useAppStore((s) => s.setAmbassadorVisible);

  useEffect(() => {
    setupNotifications();
    
    // Configure RevenueCat
    Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.ERROR);

    // RevenueCat native SDK non funziona dentro Expo Go.
    // Verrà attivato solo in Dev Build e in Produzione.
    const isExpoGo = Constants.appOwnership === "expo";
    if (isExpoGo) {
      console.log("[RevenueCat] Expo Go detected – purchases disabled. Use a Dev Build to test payments.");
      return;
    }

    const revenueCatApiKey = Platform.OS === "ios"
      ? process.env.EXPO_PUBLIC_REVENUECAT_APPLE_KEY
      : undefined; // Android key can be added later

    if (Platform.OS === "ios" || Platform.OS === "android") {
      if (revenueCatApiKey) {
        Purchases.configure({ apiKey: revenueCatApiKey });
      } else {
        console.warn("[RevenueCat] API key missing.");
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

        <PremiumModal
          visible={premiumVisible}
          onClose={() => setPremiumVisible(false)}
        />
        <AmbassadorModal
          visible={ambassadorVisible}
          onClose={() => setAmbassadorVisible(false)}
        />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
