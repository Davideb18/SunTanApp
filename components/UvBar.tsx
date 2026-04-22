/**
 * UvBar — A single vertical bar in the UV index timeline.
 *
 * Renders a proportional-height bar for a given hour and UV index value.
 * The current hour bar is highlighted in accent orange-yellow.
 */
import React from "react";
import { View, Text } from "react-native";
import { COLORS, getUvBand } from "@/constants/theme";

interface Props {
  /** Hour of day (0–23) */
  hour: number;
  /** UV index value for this hour */
  uvIndex: number;
  /** Whether this bar represents the current hour */
  isCurrentHour: boolean;
  /** Max UV across the visible timeline (used for bar height scaling) */
  maxUv: number;
}

const BAR_MAX_HEIGHT = 72;
const BAR_MIN_HEIGHT = 4;

export function UvBar({ hour, uvIndex, isCurrentHour, maxUv }: Props) {
  const ratio = maxUv > 0 ? uvIndex / maxUv : 0;
  const barHeight = Math.max(BAR_MIN_HEIGHT, Math.round(ratio * BAR_MAX_HEIGHT));

  const band = getUvBand(uvIndex);
  const barColor = isCurrentHour ? COLORS.accentOrange : band.color;
  const opacity = isCurrentHour ? 1 : 0.55;

  const hourLabel = hour === 0
    ? "12a"
    : hour < 12
    ? `${hour}a`
    : hour === 12
    ? "12p"
    : `${hour - 12}p`;

  return (
    <View className="mx-1 w-11 items-center">
      {/* UV value label above bar */}
      <Text className="mb-1 text-[11px] font-bold" style={{ color: isCurrentHour ? COLORS.accentYellow : "rgba(255,255,255,0.6)" }}>
        {uvIndex.toFixed(0)}
      </Text>

      {/* Bar */}
      <View style={{ height: BAR_MAX_HEIGHT }} className="justify-end">
        <View
          className="w-5 rounded-md"
          style={{ height: barHeight, backgroundColor: barColor, opacity }}
        />
      </View>

      {/* "NOW" label or hour */}
      <Text
        className="mt-1.5 text-[11px]"
        style={{
          fontWeight: isCurrentHour ? "800" : "500",
          color: isCurrentHour ? COLORS.accentYellow : "rgba(255,255,255,0.5)",
        }}
      >
        {isCurrentHour ? "NOW" : hourLabel}
      </Text>
    </View>
  );
}
