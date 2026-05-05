/**
 * UpsellBanner.tsx
 *
 * A persistent "cloud" upsell banner that appears at the bottom of the screen
 * on every app launch for free users. Tapping X opens PremiumModal and dismisses
 * the banner for the current session. It reappears on next app launch.
 */

import React, { useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, Animated } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Sparkles, X } from "lucide-react-native";
import { useTranslation } from "@/constants/i18n";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface UpsellBannerProps {
  onDismiss: () => void;        // Called when user taps X → also opens PremiumModal
  onPress?: () => void;         // Called when tapping the banner body
}

export function UpsellBanner({ onDismiss, onPress }: UpsellBannerProps) {
  const t = useTranslation();
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(80)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Slide up after 800ms so the screen has time to render first
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 60,
          friction: 12,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
      ]).start();
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View
      style={{
        position: "absolute",
        bottom: insets.bottom + 115, // Raised higher to clear the tab bar hump
        left: 32,
        right: 32,
        transform: [{ translateY: slideAnim }],
        opacity: opacityAnim,
        zIndex: 999,
      }}
    >
      <View
        style={{
          borderRadius: 20,
          borderWidth: 0,
          borderColor: "transparent",
          backgroundColor: "#FFFFFF",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.15,
          shadowRadius: 12,
          elevation: 10,
        }}
      >
        <TouchableOpacity
          onPress={onPress}
          activeOpacity={0.8}
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: 20,
            paddingHorizontal: 12,
            paddingVertical: 10,
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          {/* Icon */}
          <View
            style={{
              height: 28,
              width: 28,
              borderRadius: 8,
              backgroundColor: "rgba(250,204,21,0.2)",
              alignItems: "center",
              justifyContent: "center",
              marginRight: 10,
            }}
          >
            <Sparkles size={14} color="#F59E0B" />
          </View>

          {/* Text */}
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 12,
                fontWeight: "900",
                color: "black",
                letterSpacing: -0.2,
              }}
            >
              {t.unlockPro}
            </Text>
            <Text
              style={{
                fontSize: 9,
                fontWeight: "700",
                color: "rgba(0,0,0,0.4)",
                marginTop: 1,
              }}
            >
              {t.tryFreeBanner}
            </Text>
          </View>

          {/* X dismiss button */}
          <TouchableOpacity
            onPress={onDismiss}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={{
              height: 24,
              width: 24,
              borderRadius: 12,
              backgroundColor: "rgba(0,0,0,0.05)",
              alignItems: "center",
              justifyContent: "center",
              marginLeft: 8,
            }}
          >
            <X size={14} color="rgba(0,0,0,0.4)" />
          </TouchableOpacity>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}
