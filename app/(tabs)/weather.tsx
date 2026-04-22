/**
 * Weather Screen — app/(tabs)/weather.tsx
 *
 * Displays live UV index data fetched from Open-Meteo using the
 * device's GPS coordinates. Shows a horizontal timeline of UV bars
 * similar to Apple Weather.
 */
import React, { useCallback, useEffect, useState } from "react";
import { View, Text, ScrollView, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Location from "expo-location";
import { Clock, Droplet, Dna, TrendingUp, Sparkles } from "lucide-react-native";
import { useFocusEffect } from "@react-navigation/native";

import { GradientBackground } from "@/components/GradientBackground";
import { GlassCard } from "@/components/GlassCard";
import { useAppStore } from "@/store/useAppStore";
import { getUvBand, COLORS } from "@/constants/theme";
import { fetchWeatherData } from "@/utils/weather";

// (Redundant local definitions removed)

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

const hexToRgb = (hex: string) => {
  const normalized = hex.replace("#", "");
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return { r, g, b };
};

const mixHex = (fromHex: string, toHex: string, t: number) => {
  const from = hexToRgb(fromHex);
  const to = hexToRgb(toHex);
  const mix = clamp01(t);

  const r = Math.round(from.r + (to.r - from.r) * mix);
  const g = Math.round(from.g + (to.g - from.g) * mix);
  const b = Math.round(from.b + (to.b - from.b) * mix);

  return `rgb(${r}, ${g}, ${b})`;
};

const getVividUvColor = (uvValue: number) => {
  const uv = Math.max(0, uvValue);

  // Keep all bars vivid and saturated. Reach hot red earlier (around UV 6+).
  if (uv <= 2) return mixHex("#FFF000", "#FFBF00", uv / 2);
  if (uv <= 4) return mixHex("#FFBF00", "#FF7A00", (uv - 2) / 2);
  if (uv <= 6) return mixHex("#FF7A00", "#FF2A00", (uv - 4) / 2);
  return mixHex("#FF2A00", "#FF0033", clamp01((uv - 6) / 5));
};

const TIMELINE_NOW_INDEX = 12;
const TIMELINE_ITEM_WIDTH = 44;
const TIMELINE_ITEM_GAP = 0;

export default function WeatherScreen() {
  const insets = useSafeAreaInsets();
  const scrollRef = React.useRef<ScrollView>(null);
  
  // Use selective subscription for stability
  const cachedCurrentUv = useAppStore((state) => state.cachedCurrentUv);
  const locationName = useAppStore((state) => state.locationName);
  const hourlyUvData = useAppStore((state) => state.hourlyUvData);
  const setWeatherData = useAppStore((state) => state.setWeatherData);
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [timelineViewportWidth, setTimelineViewportWidth] = useState(0);
  const timelineSidePadding = Math.max(0, timelineViewportWidth / 2 - TIMELINE_ITEM_WIDTH / 2);

  const centerNowInTimeline = useCallback(
    (animated: boolean) => {
      if (!scrollRef.current || timelineViewportWidth <= 0 || hourlyUvData.length === 0) {
        return;
      }

      const step = TIMELINE_ITEM_WIDTH + TIMELINE_ITEM_GAP;
      const centerOffset = step * TIMELINE_NOW_INDEX;

      scrollRef.current.scrollTo({ x: Math.max(0, centerOffset), animated });
    },
    [hourlyUvData.length, timelineViewportWidth]
  );

  useEffect(() => {
    fetchWeather();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => centerNowInTimeline(false), 80);
    return () => clearTimeout(timer);
  }, [centerNowInTimeline]);

  useFocusEffect(
    useCallback(() => {
      const timer = setTimeout(() => centerNowInTimeline(false), 80);
      return () => clearTimeout(timer);
    }, [centerNowInTimeline])
  );

  const fetchWeather = async () => {
    setLoading(true);
    setErrorMsg(null);

    try {
      const data = await fetchWeatherData();
      setWeatherData(data);
    } catch (error: any) {
      console.error("Weather fetch error:", error);
      setErrorMsg(error.message || "Failed to fetch data");
    } finally {
      setLoading(false);
      setTimeout(() => centerNowInTimeline(true), 100);
    }
  };

  const uvInfo = getUvBand(cachedCurrentUv);
  const maxDailyUv = Math.max(...hourlyUvData, 1);

  return (
    <GradientBackground>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: insets.bottom + 100, paddingHorizontal: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="mb-6">
          <Text className="text-[32px] font-black tracking-[-1px] text-white">UV Index</Text>
          <Text className="mt-1 text-xs font-bold uppercase tracking-[2px] text-white">
            {loading ? "Detecting location..." : locationName || "Location not found"}
          </Text>
        </View>

        {errorMsg && (
          <GlassCard style={{ padding: 16, backgroundColor: "rgba(255,59,48,0.1)", borderColor: "rgba(255,59,48,0.3)", borderWidth: 1, marginBottom: 16 }}>
            <Text className="text-center text-sm font-semibold text-[#FF3B30]">{errorMsg}</Text>
          </GlassCard>
        )}

        {/* Current UV card - Centered & Glossy */}
        <GlassCard style={{ marginBottom: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" }}>
          <View className="min-h-[180px] justify-center p-[30px]">
            {loading ? (
              <ActivityIndicator color={COLORS.accentYellow} size="large" />
            ) : (
              <View className="items-center">
                <View className="mb-2 flex-row items-center rounded-[20px] bg-white/5 px-2.5 py-[5px]">
                   <Clock size={12} color={COLORS.accentYellow} style={{ marginRight: 6 }} />
                   <Text className="text-xs font-extrabold tracking-[1px]" style={{ color: COLORS.accentYellow }}>
                     {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                   </Text>
                </View>
                
                <Text className="my-1 text-[84px] font-black leading-[84px]" style={{ color: uvInfo.color }}>
                  {cachedCurrentUv.toFixed(0)}
                </Text>
                
                <View className="mb-4 flex-row items-center">
                   <Text className="text-sm font-extrabold uppercase tracking-[3px] text-white">{uvInfo.label}</Text>
                </View>

                <View className="h-[3px] w-[100px] overflow-hidden rounded bg-white/10">
                  <View style={{ height: "100%", width: `${Math.min((cachedCurrentUv / 12) * 100, 100)}%`, backgroundColor: uvInfo.color }} />
                </View>
              </View>
            )}
          </View>
        </GlassCard>

        {/* Timeline (Adaptive Scaling) */}
        {!loading && hourlyUvData.length > 0 && (
          <GlassCard style={{ padding: 24, marginBottom: 20 }}>
            <View className="mb-6 flex-row items-center justify-between">
              <View>
                <Text className="text-base font-black tracking-[0.5px] text-white">Daily Forecast</Text>
                <Text className="mt-0.5 text-[10px] font-bold uppercase text-white/40">24h Exposure View</Text>
              </View>
              <View className="flex-row items-center rounded-[10px] border border-[#FFD700]/20 bg-[#FFD700]/10 px-2.5 py-1.5">
                <Sparkles size={10} color={COLORS.accentYellow} style={{ marginRight: 4 }} />
                <Text className="text-[10px] font-black tracking-[1px]" style={{ color: COLORS.accentYellow }}>
                  PEAK {maxDailyUv.toFixed(1)}
                </Text>
              </View>
            </View>
            
            <View
              className="h-[140px]"
              onLayout={(event) => {
                setTimelineViewportWidth(event.nativeEvent.layout.width);
              }}
            >
              <ScrollView 
                ref={scrollRef}
                horizontal 
                showsHorizontalScrollIndicator={false} 
                className="flex-1"
                contentContainerStyle={{ alignItems: "flex-end", paddingHorizontal: timelineSidePadding }}
              >
                {hourlyUvData.map((uv, index) => {
                  const isNow = index === 12;
                  const nowHour = new Date().getHours();
                  const itemHour = (nowHour - 12 + index + 24) % 24;
                  const barColor = getVividUvColor(uv);
                  
                  // Adaptive Height: If max is 6, 6 fills 100% of 90px
                  const rawBarHeight = maxDailyUv > 0 ? (uv / maxDailyUv) * 90 : 2;
                  // Keep a visible vertical stroke for tiny UV values (avoid dot/pill look).
                  const barHeight = Math.max(rawBarHeight, 12);
                  const barRadius = Math.min(4, barHeight * 0.22);

                  return (
                    <View
                      key={index}
                      className="items-center"
                      style={{ marginRight: TIMELINE_ITEM_GAP, width: TIMELINE_ITEM_WIDTH }}
                    >
                      {isNow && (
                        <View
                          className="absolute z-[-1] rounded-2xl border border-white/20 bg-white/10"
                          style={{ top: 0, bottom: 0, left: -4, right: -4 }}
                        />
                      )}
                      <View className="mb-3 h-[90px] w-full items-center justify-end">
                        <View 
                          style={{
                            width: 16,
                            borderRadius: barRadius,
                            height: barHeight,
                            backgroundColor: barColor,
                            opacity: 1,
                          }}
                        />
                      </View>
                      <Text
                        className="text-[10px] font-extrabold uppercase"
                        style={{ color: isNow ? COLORS.accentYellow : "rgba(255,255,255,0.3)" }}
                      >
                        {isNow ? "NOW" : (itemHour === 0 ? "12 AM" : itemHour > 12 ? `${itemHour - 12} PM` : `${itemHour} AM`)}
                      </Text>
                      {isNow ? (
                        <Text className="mt-0.5 text-xs font-bold text-white/50">{uv.toFixed(0)}</Text>
                      ) : (
                        <Text className="mt-0.5 text-xs font-bold text-white/50">{uv.toFixed(0)}</Text>
                      )}
                    </View>
                  );
                })}
              </ScrollView>
            </View>
          </GlassCard>
        )}

        {/* STATS GRID - Glossy & Highlighted */}
        <View className="mb-4 flex-row justify-between">
          <GlassCard style={{ flex: 0.48, padding: 20, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" }}>
            <View className="w-full">
               <View className="mb-3 flex-row items-center">
                  <Clock size={16} color={COLORS.accentYellow} strokeWidth={3} />
                  <Text className="ml-2 text-[10px] font-extrabold uppercase tracking-[1px] text-white/40">Sun Exposure</Text>
               </View>
               <Text className="text-[26px] font-black tracking-[-0.5px] text-white">45<Text className="text-sm font-extrabold text-white/60">m</Text></Text>
               <View className="mt-3 h-[3px] w-full overflow-hidden rounded bg-white/5">
                  <View style={{ height: "100%", width: "45%", backgroundColor: COLORS.accentYellow }} />
               </View>
            </View>
          </GlassCard>
          
          <GlassCard style={{ flex: 0.48, padding: 20, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" }}>
            <View className="w-full">
               <View className="mb-3 flex-row items-center">
                  <Droplet size={16} color="#60A5FA" strokeWidth={3} />
                  <Text className="ml-2 text-[10px] font-extrabold uppercase tracking-[1px] text-white/40">Fluids Lost</Text>
               </View>
               <Text className="text-[26px] font-black tracking-[-0.5px] text-white">0.8<Text className="text-sm font-extrabold text-white/60">L</Text></Text>
               <View className="mt-3 h-[3px] w-full overflow-hidden rounded bg-white/5">
                  <View style={{ height: "100%", width: "60%", backgroundColor: "#60A5FA" }} />
               </View>
            </View>
          </GlassCard>
        </View>

        <View className="mb-4 flex-row justify-between">
          <GlassCard style={{ flex: 0.48, padding: 20, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" }}>
            <View className="w-full">
               <View className="mb-3 flex-row items-center">
                  <Dna size={16} color="#F472B6" strokeWidth={3} />
                  <Text className="ml-2 text-[10px] font-extrabold uppercase tracking-[1px] text-white/40">Vitamin D</Text>
               </View>
               <Text className="text-[26px] font-black tracking-[-0.5px] text-white">12k <Text className="text-sm font-extrabold text-white/60">IU</Text></Text>
               <View className="mt-3 h-[3px] w-full overflow-hidden rounded bg-white/5">
                  <View style={{ height: "100%", width: "80%", backgroundColor: "#F472B6" }} />
               </View>
            </View>
          </GlassCard>
          
          <GlassCard style={{ flex: 0.48, padding: 20, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" }}>
            <View className="w-full">
               <View className="mb-3 flex-row items-center">
                  <TrendingUp size={16} color="#34D399" strokeWidth={3} />
                  <Text className="ml-2 text-[10px] font-extrabold uppercase tracking-[1px] text-white/40">Progress</Text>
               </View>
               <Text className="text-[26px] font-black tracking-[-0.5px] text-white">+12<Text className="text-sm font-extrabold text-white/60">%</Text></Text>
               <View className="mt-3 h-[3px] w-full overflow-hidden rounded bg-white/5">
                  <View style={{ height: "100%", width: "70%", backgroundColor: "#34D399" }} />
               </View>
            </View>
          </GlassCard>
        </View>

        {/* Weekly Progression - Redesigned */}
        <GlassCard style={{ padding: 24, marginBottom: 20 }}>
          <View className="mb-6 flex-row items-center justify-between">
            <View>
              <Text className="text-base font-black tracking-[0.5px] text-white">Weekly Exposure</Text>
              <Text className="mt-0.5 text-[10px] font-bold uppercase text-white/40">Last 7 days performance</Text>
            </View>
            <TrendingUp size={20} color="rgba(255,255,255,0.4)" />
          </View>
          
          <View className="mt-5 h-[100px] justify-end">
            <View className="flex-row items-end justify-between">
               {[0.4, 0.7, 0.5, 0.9, 0.3, 0.6, 0.8].map((val, i) => (
                 <View key={i} className="items-center">
                    <View className="relative w-4 rounded-lg bg-accentYellow" style={{ height: val * 60, opacity: i === 3 ? 1 : 0.4 }}>
                       {i === 3 && (
                         <View
                           className="absolute inset-0 z-[-1] rounded-lg bg-accentYellow"
                           style={{ opacity: 0.3, transform: [{ scaleX: 1.5 }, { scaleY: 1.1 }] }}
                         />
                       )}
                    </View>
                    <Text className="mt-3 text-[10px] font-black text-white/40">{['M','T','W','T','F','S','S'][i]}</Text>
                 </View>
               ))}
            </View>
          </View>
        </GlassCard>

        {/* Collaboration / Tips Card - Glowing */}
        <GlassCard style={{ padding: 20, borderWidth: 1, borderColor: "rgba(255,215,0,0.15)", backgroundColor: "rgba(255,215,0,0.03)" }}>
          <View className="flex-row items-center">
            <View className="h-11 w-11 items-center justify-center rounded-xl bg-[#FFD700]/10">
               <Sparkles size={20} color={COLORS.accentYellow} />
            </View>
            <View className="ml-4 flex-1">
              <Text className="text-base font-black text-white">SunTan Premium Tips</Text>
              <Text className="mt-0.5 text-[13px] leading-[18px] text-white/40">
                Keep your skin hydrated after 4 PM to maximize your bronze glow.
              </Text>
            </View>
          </View>
        </GlassCard>
      </ScrollView>
    </GradientBackground>
  );
}
