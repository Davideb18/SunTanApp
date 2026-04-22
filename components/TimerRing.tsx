/**
 * TimerRing — Circular countdown progress ring.
 *
 * Displays a circular border-based progress indicator with a large
 * centered time label. Uses react-native-svg (Svg + Circle) for a
 * smooth, clean arc that works on both iOS and Android.
 *
 * The ring fills clockwise as `progress` goes from 1 (full) → 0 (empty).
 */
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { COLORS } from "@/constants/theme";

interface Props {
  /** Fraction of time remaining: 1.0 = full, 0.0 = empty */
  progress: number;
  /** Large label displayed at center (e.g. "1h 20m 05s") */
  timeLabel: string;
  /** Optional subtitle below the time (e.g. "FRONT SIDE") */
  subtitle?: string;
  /** Outer diameter in logical pixels. Defaults to 260. */
  size?: number;
  /** Whether the timer is currently running (adds glow effect). */
  isActive?: boolean;
}

export function TimerRing({
  progress,
  timeLabel,
  subtitle,
  size = 260,
  isActive = false,
}: Props) {
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  // strokeDashoffset: 0 = full ring, circumference = empty ring
  const strokeDashoffset = circumference * (1 - Math.max(0, Math.min(1, progress)));

  const center = size / 2;

  return (
    <View className="items-center justify-center" style={{ width: size, height: size }}>
      {/* Background ring (track) */}
      <Svg width={size} height={size} style={StyleSheet.absoluteFillObject}>
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke="rgba(255,255,255,0.12)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress arc */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={isActive ? COLORS.accentYellow : COLORS.accentOrange}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          // SVG starts at 3 o'clock; rotate -90° to start at 12 o'clock
          rotation="-90"
          origin={`${center}, ${center}`}
        />
      </Svg>

      {/* Centered labels */}
      <View className="items-center px-6">
        <Text
          className="text-center text-[38px] font-black tracking-[1px] text-white"
          style={isActive ? { color: COLORS.accentYellow, textShadowColor: COLORS.accentYellow } : undefined}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {timeLabel}
        </Text>
        {subtitle ? (
          <Text className="mt-1.5 text-[11px] font-extrabold uppercase tracking-[4px] text-white/55">{subtitle}</Text>
        ) : null}
      </View>
    </View>
  );
}

