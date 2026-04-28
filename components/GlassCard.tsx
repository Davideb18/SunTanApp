import React from "react";
import { View, ViewStyle, StyleProp, StyleSheet, Platform } from "react-native";
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
  intensity = 30,
  tint = "dark",
}: Props) {
  // Extract shadow properties if they are passed in the style
  const flattenedStyle = StyleSheet.flatten(style) || {};
  const { 
    shadowColor, 
    shadowOffset, 
    shadowOpacity, 
    shadowRadius, 
    elevation,
    borderRadius,
    margin,
    marginBottom,
    marginTop,
    marginLeft,
    marginRight,
    marginHorizontal,
    marginVertical,
    flex,
    width,
    height,
    aspectRatio,
    position,
    top,
    left,
    right,
    bottom,
    ...contentStyle 
  } = flattenedStyle;

  const containerStyle: ViewStyle = {
    shadowColor,
    shadowOffset,
    shadowOpacity,
    shadowRadius,
    elevation,
    margin,
    marginBottom,
    marginTop,
    marginLeft,
    marginRight,
    marginHorizontal,
    marginVertical,
    flex,
    width,
    height,
    aspectRatio,
    position,
    top,
    left,
    right,
    bottom,
  };

  const finalFlex = flex !== undefined ? flex : (height ? 0 : undefined);

  const combinedContainerStyle: ViewStyle = {
    ...containerStyle,
    ...(finalFlex !== undefined ? { flex: finalFlex } : {})
  };

  const combinedInnerStyle: ViewStyle = {
    borderRadius: borderRadius || 32,
    backgroundColor: "rgba(0,0,0,0.4)",
    flex: (flex !== undefined || height !== undefined) ? 1 : undefined,
    ...contentStyle
  };

  return (
    <View style={combinedContainerStyle}>
      <View className="overflow-hidden" style={combinedInnerStyle}>
        {/* 1. Underlying Blur */}
        <BlurView intensity={intensity} tint={tint} style={StyleSheet.absoluteFillObject} />
        
        {/* 2. Soft Dark Overlay */}
        <View className="absolute inset-0 bg-black/20" />
        
        {/* 3. Glossy Shine Gradient */}
        <LinearGradient
          colors={["rgba(255, 255, 255, 0.1)", "transparent"]}
          start={{ x: 0.3, y: 0 }}
          end={{ x: 0.7, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        
        {/* 4. Highlight Border Top (Inner shine - subtle) */}
        <View
          style={{ 
            position: "absolute",
            top: 1,
            left: 1,
            right: 1,
            bottom: 1,
            borderRadius: borderRadius || 32,
            borderTopWidth: 1, 
            borderTopColor: "rgba(255, 255, 255, 0.15)" 
          }}
        />
        
        <View className="relative">{children}</View>
      </View>
    </View>
  );
}
