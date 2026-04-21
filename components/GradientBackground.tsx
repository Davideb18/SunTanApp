/**
 * GradientBackground — Full-screen diagonal gradient wrapper.
 *
 * Wraps any screen content in the app's signature sunset gradient.
 * Used as the outermost wrapper on every screen (not in _layout to
 * avoid gradient nesting / double-render issues).
 */
import React from "react";
import { StyleSheet, ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { GRADIENT_COLORS, GRADIENT_START, GRADIENT_END } from "@/constants/theme";

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function GradientBackground({ children, style }: Props) {
  return (
    <LinearGradient
      colors={[...GRADIENT_COLORS]}
      start={GRADIENT_START}
      end={GRADIENT_END}
      style={[styles.container, style]}
    >
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
