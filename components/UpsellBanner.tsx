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
        left: 16,
        right: 16,
        transform: [{ translateY: slideAnim }],
        opacity: opacityAnim,
        zIndex: 999,
      }}
    >
      <LinearGradient
        colors={["#FACC15", "#F97316", "#EF4444"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{
          borderRadius: 28,
          padding: 2,
          // Cloud-like shadow
          shadowColor: "#F97316",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.5,
          shadowRadius: 20,
          elevation: 20,
        }}
      >
        <TouchableOpacity
          onPress={onPress}
          activeOpacity={0.9}
          style={{
            backgroundColor: "rgba(0,0,0,0.85)",
            borderRadius: 26,
            paddingHorizontal: 18,
            paddingVertical: 14,
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          {/* Icon */}
          <View
            style={{
              height: 38,
              width: 38,
              borderRadius: 14,
              backgroundColor: "rgba(250,204,21,0.15)",
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: "rgba(250,204,21,0.3)",
              marginRight: 12,
            }}
          >
            <Sparkles size={18} color="#FACC15" />
          </View>

          {/* Text */}
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 13,
                fontWeight: "900",
                color: "white",
                letterSpacing: -0.3,
              }}
            >
              ✨ {t.unlockPro}
            </Text>
            <Text
              style={{
                fontSize: 10,
                fontWeight: "700",
                color: "rgba(255,255,255,0.5)",
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
              height: 28,
              width: 28,
              borderRadius: 14,
              backgroundColor: "rgba(255,255,255,0.1)",
              alignItems: "center",
              justifyContent: "center",
              marginLeft: 8,
            }}
          >
            <X size={14} color="rgba(255,255,255,0.6)" />
          </TouchableOpacity>
        </TouchableOpacity>
      </LinearGradient>
    </Animated.View>
  );
}
