/**
 * UvBar — A single vertical bar in the UV index timeline.
 *
 * Renders a proportional-height bar for a given hour and UV index value.
 * The current hour bar is highlighted in accent orange-yellow.
 */
import React from "react";
import { View, Text, StyleSheet } from "react-native";
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
    <View style={styles.column}>
      {/* UV value label above bar */}
      <Text style={[styles.uvLabel, { color: isCurrentHour ? COLORS.accentYellow : "rgba(255,255,255,0.6)" }]}>
        {uvIndex.toFixed(0)}
      </Text>

      {/* Bar */}
      <View style={styles.barContainer}>
        <View
          style={[
            styles.bar,
            { height: barHeight, backgroundColor: barColor, opacity },
          ]}
        />
      </View>

      {/* "NOW" label or hour */}
      <Text style={[styles.hourLabel, isCurrentHour && styles.nowLabel]}>
        {isCurrentHour ? "NOW" : hourLabel}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  column: {
    alignItems: "center",
    width: 44,
    marginHorizontal: 4,
  },
  uvLabel: {
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 4,
  },
  barContainer: {
    height: BAR_MAX_HEIGHT,
    justifyContent: "flex-end",
  },
  bar: {
    width: 20,
    borderRadius: 6,
  },
  hourLabel: {
    fontSize: 11,
    fontWeight: "500",
    color: "rgba(255,255,255,0.5)",
    marginTop: 6,
  },
  nowLabel: {
    color: "#FFDE00",
    fontWeight: "800",
  },
});
