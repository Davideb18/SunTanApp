/**
 * GlassCard — Glassmorphism card using BlurView.
 *
 * The primary card/modal surface across the app. Combines:
 *  - BlurView (tint: "dark", intensity: 20) for the frosted glass effect
 *  - Semi-transparent black overlay (bg-black/30)
 *  - Subtle white border (border-white/20)
 */
import React from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import { BlurView } from "expo-blur";

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
  /** BlurView intensity (0–100). Defaults to 20. */
  intensity?: number;
  /** BlurView tint. Defaults to "dark". */
  tint?: "light" | "dark" | "default";
  className?: string;
}

export function GlassCard({
  children,
  style,
  intensity = 20,
  tint = "dark",
}: Props) {
  return (
    <View style={[styles.wrapper, style]}>
      <BlurView intensity={intensity} tint={tint} style={StyleSheet.absoluteFill} />
      <View style={styles.overlay} />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.20)",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.30)",
  },
  content: {
    position: "relative",
  },
});
