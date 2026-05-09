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
import { LocationModal } from "@/components/LocationModal";
import { refreshGPSNotifications } from "../utils/notificationEngine";
import * as SplashScreen from "expo-splash-screen";
import "../global.css";

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const premiumVisible = useAppStore((s) => s.premiumVisible);
  const setPremiumVisible = useAppStore((s) => s.setPremiumVisible);
  const ambassadorVisible = useAppStore((s) => s.ambassadorVisible);
  const setAmbassadorVisible = useAppStore((s) => s.setAmbassadorVisible);
  const locationModalVisible = useAppStore((s) => s.locationModalVisible);
  const setLocationModalVisible = useAppStore((s) => s.setLocationModalVisible);

  useEffect(() => {
    setupNotifications();
    
    // RevenueCat native SDK non funziona dentro Expo Go.
    // Verrà attivato solo in Dev Build e in Produzione.
    const isExpoGo = Constants.appOwnership === "expo";
    if (isExpoGo) {
      console.log("[RevenueCat] Expo Go detected – purchases disabled. Use a Dev Build to test payments.");
      return;
    }

    // Configure RevenueCat
    Purchases.setLogLevel(LOG_LEVEL.INFO);

    const revenueCatApiKey = Platform.OS === "ios"
      ? process.env.EXPO_PUBLIC_REVENUECAT_APPLE_KEY
      : undefined; // Android key can be added later

    if (Platform.OS === "ios" || Platform.OS === "android") {
      if (revenueCatApiKey) {
        console.log(`[RevenueCat] Using API key present: ${revenueCatApiKey ? 'yes' : 'no'}`);
        try {
          Purchases.configure({ apiKey: revenueCatApiKey });
          console.log("[RevenueCat] Purchases configuration initiated");
        } catch (e) {
          console.error("[RevenueCat] Purchases.configure() threw:", e);
        }
      } else {
        console.warn("[RevenueCat] API key missing.");
      }
    }

    // Refresh GPS-locked notifications on app launch
    refreshGPSNotifications();

    // Hide splash screen after a short delay to ensure UI is ready
    const hideSplash = async () => {
      await new Promise(resolve => setTimeout(resolve, 200));
      await SplashScreen.hideAsync();
    };
    hideSplash();
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
        <LocationModal
          visible={locationModalVisible}
          onClose={() => setLocationModalVisible(false)}
          onRefresh={() => {
            // This will be handled by the screens which use the location
          }}
        />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
