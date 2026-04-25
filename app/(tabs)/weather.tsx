/**
 * Weather Screen — app/(tabs)/weather.tsx
 *
 * Displays live UV index data fetched from Open-Meteo using the
 * device's GPS coordinates. Shows a horizontal timeline of UV bars
 * similar to Apple Weather.
 */
import React, { useCallback, useEffect, useState } from "react";
import { View, Text, ScrollView, ActivityIndicator, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Clock, Droplet, Dna, TrendingUp, Sparkles, Cloud, AlertTriangle, Calendar, Moon, Sun, CloudRain, CloudSnow, CloudLightning, SunDim, CloudSun, CloudDrizzle, CloudFog, Zap, Layers, Info, ShieldCheck } from "lucide-react-native";
import { useFocusEffect } from "@react-navigation/native";

const getWeatherIcon = (code: number, size: number = 18, color: string = COLORS.accentYellow) => {
  // WMO Weather interpretation codes (WW)
  // 0, 1: Clear sky, Mainly clear
  if (code === 0 || code === 1) return <Sun size={size} color={color} />;
  // 2: Partly cloudy
  if (code === 2) return <CloudSun size={size} color={color} />;
  // 3: Overcast
  if (code === 3) return <Cloud size={size} color="#94A3B8" />;
  // 45, 48: Fog
  if (code === 45 || code === 48) return <CloudFog size={size} color="#94A3B8" />;
  // 51, 53, 55: Drizzle
  if (code >= 51 && code <= 55) return <CloudDrizzle size={size} color="#60A5FA" />;
  // 61, 63, 65, 80, 81, 82: Rain
  if ((code >= 61 && code <= 65) || (code >= 80 && code <= 82)) return <CloudRain size={size} color="#3B82F6" />;
  // 71, 73, 75, 77, 85, 86: Snow
  if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return <CloudSnow size={size} color="#E2E8F0" />;
  // 95, 96, 99: Thunderstorm
  if (code >= 95 && code <= 99) return <CloudLightning size={size} color="#FACC15" />;
  
  return <Sun size={size} color={color} />;
};

import { GradientBackground } from "@/components/GradientBackground";
import { GlassCard } from "@/components/GlassCard";
import { useAppStore } from "@/store/useAppStore";
import { getUvBand, COLORS } from "@/constants/theme";
import { fetchWeatherData, WeatherData } from "@/utils/weather";

const TIMELINE_ITEM_WIDTH = 42;
const TIMELINE_ITEM_GAP = 12;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function WeatherScreen() {
  const insets = useSafeAreaInsets();
  const { cachedCurrentUv, setCachedCurrentUv, history, dailyGoalMinutes } = useAppStore();

  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [timelineViewportWidth, setTimelineViewportWidth] = useState(0);

  // Calculate Real Stats from History
  const today = new Date().toISOString().split('T')[0];
  const todaySessions = history.filter(item => item.date.startsWith(today));
  
  const dailyVitD = todaySessions.reduce((acc, s) => acc + (s.vitD || 0), 0);
  const dailyFluids = todaySessions.reduce((acc, s) => acc + (s.sweatMl || 0), 0) / 1000; // Convert to Liters
  const dailySeconds = todaySessions.reduce((acc, s) => acc + (s.totalSeconds || 0), 0);
  
  // Progress based on user's daily goal (minutes converted to seconds)
  const targetSeconds = (dailyGoalMinutes || 40) * 60;
  const dailyProgress = Math.min((dailySeconds / targetSeconds) * 100, 100);

  const scrollRef = React.useRef<ScrollView>(null);
  const timelineSidePadding = (timelineViewportWidth - TIMELINE_ITEM_WIDTH) / 2;

  const loadWeather = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const data = await fetchWeatherData();
      setWeather(data);
      setCachedCurrentUv(data.currentUv);
    } catch (err) {
      console.error(err);
      setErrorMsg("Unable to fetch weather data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWeather();
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (scrollRef.current && weather) {
        setTimeout(() => {
          scrollRef.current?.scrollTo({
            x: 12 * (TIMELINE_ITEM_WIDTH + TIMELINE_ITEM_GAP),
            animated: true,
          });
        }, 300);
      }
    }, [weather])
  );

  const getVividUvColor = (uv: number) => {
    if (uv < 3) return "#4ADE80";
    if (uv < 6) return "#FACC15";
    if (uv < 8) return "#FB923C";
    if (uv < 11) return "#F87171";
    return "#C084FC";
  };

  const getBurnRisk = (uv: number, humidity: number, clouds: number) => {
    let risk = uv * 1.2;
    if (humidity > 70) risk *= 1.15;
    if (clouds < 20) risk *= 1.2;
    if (risk > 10) return { label: "EXTREME", color: "#EF4444", emoji: "🔥" };
    if (risk > 7) return { label: "HIGH", color: "#F97316", emoji: "⚠️" };
    if (risk > 4) return { label: "MODERATE", color: "#FBBF24", emoji: "⚖️" };
    return { label: "LOW", color: "#22C55E", emoji: "✅" };
  };

  const getSafeWindow = (uv: number) => {
    if (uv <= 0) return "∞";
    const minutes = Math.round(180 / Math.max(uv, 0.5));
    if (minutes > 120) return "2h+";
    return `${minutes}m`;
  };

  const uvInfo = getUvBand(cachedCurrentUv);
  const maxDailyUv = weather ? Math.max(...weather.hourlyUvData, 1) : 1;
  const burnRisk = weather ? getBurnRisk(weather.currentUv, weather.humidity, weather.cloudCover) : { label: "LOW", color: "#22C55E", emoji: "✅" };
  const safeWindow = getSafeWindow(cachedCurrentUv);

  return (
    <GradientBackground>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: insets.bottom + 100, paddingHorizontal: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="mb-6">
          <Text className="text-[32px] font-black tracking-[-1px] text-white">Environment</Text>
          <Text className="mt-1 text-xs font-bold uppercase tracking-[2px] text-white/50">
            {loading ? "Detecting location..." : weather?.locationName || "Location not found"}
          </Text>
        </View>

        {errorMsg && (
          <GlassCard style={{ padding: 16, backgroundColor: "rgba(255,59,48,0.1)", borderColor: "#FF3B30", borderWidth: 1, marginBottom: 16 }}>
            <Text className="text-center text-sm font-semibold text-[#FF3B30]">{errorMsg}</Text>
          </GlassCard>
        )}

        {/* 1. UV NOW - Main Card */}
        <GlassCard style={{ marginBottom: 16, borderWidth: 1, borderColor: "#FFFFFF", backgroundColor: "rgba(0,0,0,0.7)", shadowColor: "#000", shadowOpacity: 0.6, shadowRadius: 25, elevation: 20 }}>
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
                <View className="h-[4px] w-[120px] overflow-hidden rounded-full bg-white/10">
                  <View style={{ height: "100%", width: `${Math.min((cachedCurrentUv / 12) * 100, 100)}%`, backgroundColor: uvInfo.color }} />
                </View>
              </View>
            )}
          </View>
        </GlassCard>

        {/* 2. ADVANCED RISK BOX (Burn Risk + 3 Metrics) */}
        {!loading && weather && (
          <GlassCard style={{ padding: 24, marginBottom: 24, borderWidth: 1.5, borderColor: "#FFFFFF", backgroundColor: "rgba(0,0,0,0.7)", shadowColor: "#000", shadowOpacity: 0.6, shadowRadius: 25, elevation: 20 }}>
            <View className="flex-row items-center justify-between mb-8">
              <View>
                <Text className="text-[10px] font-black uppercase tracking-[2px] text-white mb-1">Exposure Safety</Text>
                <Text className="text-2xl font-black text-white">Burn Risk</Text>
              </View>
              <View className="flex-row items-center px-5 py-2.5 rounded-2xl" style={{ backgroundColor: `${burnRisk.color}20`, borderWidth: 1, borderColor: `${burnRisk.color}40` }}>
                <Text className="text-lg mr-2">{burnRisk.emoji}</Text>
                <Text className="text-lg font-black" style={{ color: burnRisk.color }}>{burnRisk.label}</Text>
              </View>
            </View>
            
            <View className="flex-row justify-between mb-2">
              <View className="items-center flex-1">
                <Cloud size={20} color="white" opacity={0.6} />
                <Text className="mt-3 text-[22px] font-black text-white">{weather.cloudCover}%</Text>
                <Text className="text-[9px] font-bold text-white/40 uppercase tracking-[1px] mt-1">Clouds</Text>
              </View>
              <View className="w-[1px] bg-white/10 mx-4" />
              <View className="items-center flex-1">
                <Droplet size={20} color="#60A5FA" opacity={0.8} />
                <Text className="mt-3 text-[22px] font-black text-white">{weather.humidity}%</Text>
                <Text className="text-[9px] font-bold text-white/40 uppercase tracking-[1px] mt-1" >Humidity</Text>
              </View>
              <View className="w-[1px] bg-white/10 mx-4" />
              <View className="items-center flex-1">
                <Clock size={20} color={COLORS.accentYellow} opacity={0.8} />
                <Text className="mt-3 text-[22px] font-black text-white">{safeWindow}</Text>
                <Text className="text-[9px] font-bold text-white/40 uppercase tracking-[1px] mt-1">Safe Window</Text>
              </View>
            </View>
          </GlassCard>
        )}

        {/* 3. 24h TIMELINE */}
        {!loading && weather && (
          <GlassCard style={{ padding: 24, marginBottom: 24, borderWidth: 1, borderColor: "#FFFFFF", backgroundColor: "rgba(0,0,0,0.7)", shadowColor: "#000", shadowOpacity: 0.6, shadowRadius: 25, elevation: 20 }}>
            <View className="mb-6 flex-row items-center justify-between">
              <View>
                <Text className="text-base font-black tracking-[0.5px] text-white">Daily Forecast</Text>
                <Text className="mt-0.5 text-[10px] font-bold uppercase text-white/40">24h UV Projection</Text>
              </View>
              <View className="flex-row items-center rounded-[10px] border border-[#FFD700]/20 bg-[#FFD700]/10 px-2.5 py-1.5">
                <Sparkles size={10} color={COLORS.accentYellow} style={{ marginRight: 4 }} />
                <Text className="text-[10px] font-black tracking-[1px]" style={{ color: COLORS.accentYellow }}>
                  PEAK {maxDailyUv.toFixed(1)}
                </Text>
              </View>
            </View>
            
            <View className="h-[170px]" onLayout={(event) => setTimelineViewportWidth(event.nativeEvent.layout.width)}>
              <ScrollView 
                ref={scrollRef}
                horizontal 
                showsHorizontalScrollIndicator={false} 
                contentContainerStyle={{ alignItems: "flex-end", paddingHorizontal: timelineSidePadding, paddingBottom: 30 }}
              >
                {weather.hourlyUvData.map((uv, index) => {
                  const isNow = index === 12;
                  const nowHour = new Date().getHours();
                  const itemHour = (nowHour - 12 + index + 24) % 24;
                  const barColor = getVividUvColor(uv);
                  const barHeight = Math.max((uv / maxDailyUv) * 90, 8);
                  let hourLabel = isNow ? "NOW" : (itemHour === 0 ? "12A" : (itemHour === 12 ? "12P" : (itemHour > 12 ? `${itemHour - 12}P` : `${itemHour}A`)));

                  return (
                    <View key={index} className="items-center" style={{ marginRight: TIMELINE_ITEM_GAP, width: TIMELINE_ITEM_WIDTH }}>
                      {isNow && (
                        <View className="absolute z-[-1] rounded-3xl border-2 border-white/30 bg-white/10" style={{ top: -10, bottom: -30, left: -6, right: -6 }} />
                      )}
                      <View className="mb-3 h-[90px] w-full items-center justify-end">
                        <View style={{ width: 14, borderRadius: 7, height: barHeight, backgroundColor: barColor }} />
                      </View>
                      <Text className="text-[12px] font-black text-center" style={{ color: isNow ? COLORS.accentYellow : "rgba(255,255,255,0.6)" }}>{hourLabel}</Text>
                      <Text className="mt-1 text-[11px] font-black text-center" style={{ color: isNow ? COLORS.accentYellow : "rgba(255,255,255,0.3)" }}>{(uv ?? 0).toFixed(0)}</Text>
                    </View>
                  );
                })}
              </ScrollView>
            </View>

            <View className="mt-8 flex-row items-center justify-center bg-white/5 py-3 rounded-2xl border border-white/5">
              <Moon size={14} color="#A78BFA" />
              <Text className="ml-3 text-[11px] font-black text-white uppercase tracking-[1.5px]">Sunset at {weather.sunset}</Text>
            </View>
          </GlassCard>
        )}

        {/* 4. METRICS GRID - Optimized Boxes with Intensity Lines */}
        {!loading && weather && (
          <View className="gap-y-4">
            <View className="flex-row justify-between">
              <GlassCard style={{ flex: 0.48, padding: 20, borderWidth: 1.5, borderColor: "#FFFFFF", backgroundColor: "rgba(0,0,0,0.7)", shadowColor: "#000", shadowOpacity: 0.6, shadowRadius: 25, elevation: 20 }}>
                <Zap size={18} color={COLORS.accentYellow} />
                <Text className="mt-3 text-[22px] font-black text-white">{Math.round(weather.shortwaveRadiation)}<Text className="text-[10px]">W</Text></Text>
                <Text className="text-[9px] font-black text-white uppercase tracking-[1px] mt-1">Solar Intensity</Text>
                <Text className="mt-2 text-[9px] font-bold text-accentYellow uppercase">{weather.shortwaveRadiation > 600 ? "Strong • Fast Tan" : "Low • Slow Tan"}</Text>
                <View className="mt-3 h-[3px] w-full overflow-hidden rounded bg-white/5">
                  <View style={{ height: "100%", width: `${Math.min((weather.shortwaveRadiation / 1000) * 100, 100)}%`, backgroundColor: COLORS.accentYellow }} />
                </View>
              </GlassCard>
              <GlassCard style={{ flex: 0.48, padding: 20, borderWidth: 1.5, borderColor: "#FFFFFF", backgroundColor: "rgba(0,0,0,0.7)", shadowColor: "#000", shadowOpacity: 0.6, shadowRadius: 25, elevation: 20 }}>
                <Layers size={18} color="#A78BFA" />
                <Text className="mt-3 text-[22px] font-black text-white">{Math.round((weather.diffuseRadiation / (weather.shortwaveRadiation || 1)) * 100)}%</Text>
                <Text className="text-[9px] font-black text-white uppercase tracking-[1px] mt-1">Reflection</Text>
                <Text className="mt-2 text-[9px] font-bold text-[#A78BFA] uppercase">UV Bouncing</Text>
                <View className="mt-3 h-[3px] w-full overflow-hidden rounded bg-white/5">
                  <View style={{ height: "100%", width: `${Math.min((weather.diffuseRadiation / (weather.shortwaveRadiation || 1)) * 100, 100)}%`, backgroundColor: "#A78BFA" }} />
                </View>
              </GlassCard>
            </View>

            <View className="flex-row justify-between">
              <GlassCard style={{ flex: 0.48, padding: 20, borderWidth: 1.5, borderColor: "#FFFFFF", backgroundColor: "rgba(0,0,0,0.7)", shadowColor: "#000", shadowOpacity: 0.6, shadowRadius: 25, elevation: 20 }}>
                <Dna size={18} color="#F472B6" />
                <Text className="mt-3 text-[22px] font-black text-white">
                  {dailyVitD < 1000 ? Math.round(dailyVitD) : `${(dailyVitD / 1000).toFixed(1)}k`}
                  <Text className="text-[10px]">{dailyVitD < 1000 ? "IU" : "IU"}</Text>
                </Text>
                <Text className="text-[9px] font-black text-white uppercase tracking-[1px] mt-1">Vitamin D</Text>
                <Text className="mt-2 text-[9px] font-bold text-[#F472B6] uppercase">{dailyVitD > 5000 ? "Active Load" : "Daily Intake"}</Text>
                <View className="mt-3 h-[3px] w-full overflow-hidden rounded bg-white/5">
                  <View style={{ height: "100%", width: `${Math.min((dailyVitD / 15000) * 100, 100)}%`, backgroundColor: "#F472B6" }} />
                </View>
              </GlassCard>
              <GlassCard style={{ flex: 0.48, padding: 20, borderWidth: 1.5, borderColor: "#FFFFFF", backgroundColor: "rgba(0,0,0,0.7)", shadowColor: "#000", shadowOpacity: 0.6, shadowRadius: 25, elevation: 20 }}>
                <Droplet size={18} color="#60A5FA" />
                <Text className="mt-3 text-[22px] font-black text-white">{dailyFluids.toFixed(2)}L</Text>
                <Text className="text-[9px] font-black text-white uppercase tracking-[1px] mt-1">Fluids Lost</Text>
                <Text className="mt-2 text-[9px] font-bold text-[#60A5FA] uppercase">{dailyFluids > 1 ? "Rehydrate!" : "Safe Levels"}</Text>
                <View className="mt-3 h-[3px] w-full overflow-hidden rounded bg-white/5">
                  <View style={{ height: "100%", width: `${Math.min((dailyFluids / 2.0) * 100, 100)}%`, backgroundColor: "#60A5FA" }} />
                </View>
              </GlassCard>
            </View>

            <View className="flex-row justify-between">
              <GlassCard style={{ flex: 1, padding: 20, borderWidth: 1.5, borderColor: "#FFFFFF", backgroundColor: "rgba(0,0,0,0.7)", shadowColor: "#000", shadowOpacity: 0.6, shadowRadius: 25, elevation: 20 }}>
                <TrendingUp size={18} color="#34D399" />
                <View className="flex-row items-baseline justify-between">
                  <Text className="mt-3 text-[22px] font-black text-white">{Math.round(dailyProgress)}%</Text>
                  <Text className="text-[9px] font-black text-white uppercase tracking-[1px]">Daily Tanning Goal</Text>
                </View>
                <Text className="mt-2 text-[9px] font-bold text-[#34D399] uppercase">{dailyProgress >= 100 ? "Goal Reached!" : "Session Pending"}</Text>
                <View className="mt-3 h-[4px] w-full overflow-hidden rounded bg-white/5">
                  <View style={{ height: "100%", width: `${dailyProgress}%`, backgroundColor: "#34D399" }} />
                </View>
              </GlassCard>
            </View>

            {/* Tomorrow Strategic Card */}
            <GlassCard style={{ padding: 24, borderWidth: 1.5, borderColor: "#FFFFFF", backgroundColor: "rgba(0,0,0,0.7)", shadowColor: "#000", shadowOpacity: 0.6, shadowRadius: 25, elevation: 20, marginBottom: 8 }}>
               <View className="flex-row items-center justify-between mb-6">
                  <View className="flex-row items-center">
                    <Calendar size={18} color={COLORS.accentYellow} />
                    <Text className="ml-3 text-base font-black text-white">Tomorrow's Strategy</Text>
                  </View>
                  <View className="bg-accentYellow/10 border border-accentYellow/20 px-3 py-1 rounded-xl">
                    <Text className="text-[10px] font-black text-accentYellow uppercase">Best: {weather.dailyForecast[0].bestStartTime}</Text>
                  </View>
               </View>
               <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    {getWeatherIcon(weather.dailyForecast[0].weatherCode, 32)}
                    <View className="ml-4">
                      <Text className="text-3xl font-black text-white">{weather.dailyForecast[0].tempMax.toFixed(0)}°</Text>
                      <Text className="text-[10px] font-bold text-white/30 uppercase tracking-[1px]">Peak UV {weather.dailyForecast[0].uvMax.toFixed(1)}</Text>
                    </View>
                  </View>
                  <View className="flex-1 ml-8 pl-6 border-l border-white/10">
                    <Text className="text-[11px] font-bold text-white/60 leading-[16px]">
                      Optimal window for tanning: <Text className="text-white font-black">{weather.dailyForecast[0].bestStartTime} - {weather.dailyForecast[0].bestEndTime}</Text>. Use SPF 30+.
                    </Text>
                  </View>
               </View>
            </GlassCard>
          </View>
        )}

        {/* 5. WEEKLY OUTLOOK */}
        {!loading && weather && (
          <GlassCard style={{ padding: 24, marginTop: 16, borderWidth: 1, borderColor: "#FFFFFF", backgroundColor: "rgba(0,0,0,0.7)", shadowColor: "#000", shadowOpacity: 0.6, shadowRadius: 25, elevation: 20 }}>
            <View className="mb-6 flex-row items-center justify-between">
              <View className="flex-row items-center">
                <Calendar size={18} color={COLORS.accentYellow} />
                <Text className="ml-3 text-base font-black text-white">Weekly Outlook</Text>
              </View>
            </View>
            <View className="gap-2">
              {weather.dailyForecast.slice(1).map((day, idx) => (
                <View key={idx} className={`flex-row items-center justify-between py-4 ${idx < weather.dailyForecast.length - 2 ? 'border-b border-white/5' : ''}`}>
                  <Text className="flex-1 text-[15px] font-bold text-white/60">{new Date(day.date).toLocaleDateString('en-US', { weekday: 'long' })}</Text>
                  <View className="flex-row items-center flex-[1.5] justify-center">
                    {getWeatherIcon(day.weatherCode, 20)}
                    <View className="ml-4 items-center">
                      <Text className="text-[10px] font-black text-accentYellow uppercase tracking-[1px]">UV PEAK</Text>
                      <Text className="text-sm font-black text-white">{day.uvMax.toFixed(1)}</Text>
                    </View>
                  </View>
                  <View className="flex-row items-center justify-end flex-1">
                    <Text className="text-lg font-black text-white">{day.tempMax.toFixed(0)}°</Text>
                  </View>
                </View>
              ))}
            </View>
          </GlassCard>
        )}

        {/* Scientific Intelligence & Safety Footer */}
        {!loading && weather && (
          <View className="mt-12 mb-10 items-center px-4">
            <View className="h-[1px] w-12 bg-white/20 mb-8" />
            <View className="flex-row items-center mb-5">
              <ShieldCheck size={16} color="rgba(255,255,255,0.6)" />
              <Text className="ml-3 text-[11px] font-black uppercase tracking-[2px] text-white/50">Scientific Intelligence</Text>
            </View>
            <Text className="text-center text-[11px] leading-[20px] text-white/50 font-medium px-4">
              Environmental metrics powered by <Text className="text-white/80 font-black">Open-Meteo</Text> utilizing high-resolution atmospheric models from <Text className="text-white/80 font-black">ECMWF</Text> and <Text className="text-white/80 font-black">Copernicus CAMS</Text>.
            </Text>
            <View className="mt-10 flex-row items-start bg-white/[0.05] p-6 rounded-[32px] border border-white/10">
              <Info size={16} color="rgba(255,255,255,0.4)" style={{ marginTop: 2 }} />
              <View className="ml-4 flex-1">
                <Text className="text-[10px] leading-[18px] text-white/40 font-bold uppercase tracking-[0.5px]">
                  <Text className="text-white/70 font-black">Safety Notice:</Text> All metrics are scientific estimates for guidance. Sun exposure carries inherent risks; always monitor your skin response and consult a health professional.
                </Text>
              </View>
            </View>
            <Text className="mt-12 text-[10px] font-black text-white/30 uppercase tracking-[4px]">Glowly v1.0 • Global Satellite Mesh</Text>
          </View>
        )}
      </ScrollView>
    </GradientBackground>
  );
}
