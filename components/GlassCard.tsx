import React from "react";
import { View, ViewStyle, StyleProp, StyleSheet } from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";

interface Props {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** BlurView intensity (0–100). Defaults to 30. */
  intensity?: number;
  /** BlurView tint. Defaults to "dark". */
  tint?: "light" | "dark" | "default";
}

export function GlassCard({
  children,
  style,
  intensity = 30, // Increased default intensity for better glass feel
  tint = "dark",
}: Props) {
  return (
    <View className="overflow-hidden rounded-[24px] border border-white/15 bg-black/10" style={style}>
      {/* 1. Underlying Blur */}
      <BlurView intensity={intensity} tint={tint} style={StyleSheet.absoluteFillObject} />
      
      {/* 2. Soft Dark Overlay */}
      <View className="absolute inset-0 bg-black/25" />
      
      {/* 3. Glossy Shine Gradient */}
      <LinearGradient
        colors={["rgba(255, 255, 255, 0.08)", "transparent"]}
        start={{ x: 0.3, y: 0 }}
        end={{ x: 0.7, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      
      {/* 4. Highlight Border Top (Inner stroke) */}
      <View
        className="absolute inset-0 rounded-[24px]"
        style={{ borderTopWidth: 1.5, borderTopColor: "rgba(255, 255, 255, 0.25)" }}
      />
      
      <View className="relative">{children}</View>
    </View>
  );
}
