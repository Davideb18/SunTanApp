import React from "react";
import { StyleSheet, View, ViewStyle, StyleProp } from "react-native";
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
    <View style={[styles.wrapper, style]}>
      {/* 1. Underlying Blur */}
      <BlurView intensity={intensity} tint={tint} style={StyleSheet.absoluteFill} />
      
      {/* 2. Soft Dark Overlay */}
      <View style={styles.overlay} />
      
      {/* 3. Glossy Shine Gradient */}
      <LinearGradient
        colors={["rgba(255, 255, 255, 0.08)", "transparent"]}
        start={{ x: 0.3, y: 0 }}
        end={{ x: 0.7, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      
      {/* 4. Highlight Border Top (Inner stroke) */}
      <View style={styles.topStroke} />
      
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    backgroundColor: "rgba(0, 0, 0, 0.1)",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.25)",
  },
  topStroke: {
    ...StyleSheet.absoluteFillObject,
    borderTopWidth: 1.5,
    borderTopColor: "rgba(255, 255, 255, 0.25)",
    borderRadius: 24,
  },
  content: {
    position: "relative",
  },
});
