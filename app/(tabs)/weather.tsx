import React, { useCallback, useEffect, useState } from "react";
import { View, Text, ScrollView, ActivityIndicator, Dimensions, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ExpoLocation from "expo-location";
import * as Notifications from "expo-notifications";
import {
  Clock, Droplet, Dna, TrendingUp, Sparkles, Cloud, 
  AlertTriangle, Calendar, Moon, Sun, CloudRain, 
  CloudSnow, CloudLightning, SunDim, CloudSun, 
  CloudDrizzle, CloudFog, Zap, Layers, Info, 
  ShieldCheck, Globe, Coins, Settings, Lock, MapPin, ChevronDown
} from "lucide-react-native";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";

import { GradientBackground } from "@/components/GradientBackground";
import { GlassCard } from "@/components/GlassCard";
import { useAppStore } from "@/store/useAppStore";
import { getUvBand, COLORS } from "@/constants/theme";
import { fetchWeatherData, WeatherData, getWeatherDescription } from "@/utils/weather";
import { HeaderButtons } from "../../components/HeaderButtons";
import { PremiumModal } from "../../components/PremiumModal";
import { useTranslation } from "@/constants/i18n";
import { SettingsModal } from "@/components/SettingsModal";
import { AmbassadorModal } from "@/components/AmbassadorModal";
import { AmbassadorCard } from "../../components/AmbassadorCard";
import { getSkinMultiplier } from "@/utils/skin";
import { calculateSafeMinutes } from "@/utils/tanning";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const getWeatherIcon = (code: number, size: number = 18, color: string = COLORS.accentYellow) => {
  if (code === 0 || code === 1) return <Sun size={size} color={color} />;
  if (code === 2) return <CloudSun size={size} color={color} />;
  if (code === 3) return <Cloud size={size} color="#94A3B8" />;
  if (code === 45 || code === 48) return <CloudFog size={size} color="#94A3B8" />;
  if (code >= 51 && code <= 55) return <CloudDrizzle size={size} color="#60A5FA" />;
  if ((code >= 61 && code <= 65) || (code >= 80 && code <= 82)) return <CloudRain size={size} color="#3B82F6" />;
  if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return <CloudSnow size={size} color="#E2E8F0" />;
  if (code >= 95 && code <= 99) return <CloudLightning size={size} color="#FACC15" />;
  return <Sun size={size} color={color} />;
};

const TIMELINE_ITEM_WIDTH = 42;
const TIMELINE_ITEM_GAP = 12;

export default function WeatherScreen() {
  const t = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { 
    cachedCurrentUv, 
    setWeatherData, 
    history, 
    dailyGoalMinutes, 
    fitzpatrickLevel, 
    hasPremium, 
    mockLocation, 
    utcOffset,
    currentSpf
  } = useAppStore();

  const [weather, setWeather] = useState<WeatherData | null>(null);
  // ... (existing states)

  const getLocalTime = () => {
    const utcTime = new Date();
    const utcHours = utcTime.getUTCHours();
    const utcMinutes = utcTime.getUTCMinutes();
    
    // Calculate fractional hour to handle non-integer offsets (rare but possible)
    const localHourFractional = (utcHours + utcMinutes / 60 + utcOffset / 3600 + 24) % 24;
    const localHour = Math.floor(localHourFractional);
    const localMinute = Math.floor((localHourFractional % 1) * 60);
    
    return `${String(localHour).padStart(2, '0')}:${String(localMinute).padStart(2, '0')}`;
  };
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [timelineViewportWidth, setTimelineViewportWidth] = useState(0);
  const [permissionStatus, setPermissionStatus] = useState<string | null>(null);

  const [premiumVisible, setPremiumVisible] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const setLocationModalVisible = useAppStore((s) => s.setLocationModalVisible);
  const ambassadorVisible = useAppStore((s) => s.ambassadorVisible);
  const setAmbassadorVisible = useAppStore((s) => s.setAmbassadorVisible);
  const mainScrollRef = React.useRef<ScrollView>(null);
  const ambassadorRef = React.useRef<View>(null);

  useEffect(() => {
    loadWeather();
  }, [mockLocation]);

  const loadWeather = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      
      const data = await fetchWeatherData();
      setWeather(data);
      setWeatherData({
        currentUv: data.currentUv,
        currentTemp: data.currentTemp,
        feelsLikeTemp: data.feelsLikeTemp,
        hourlyUvData: data.hourlyUvData,
        locationName: data.locationName,
        utcOffset: data.utcOffset,
      });
    } catch (e: any) {
      console.error(e);
      if (e.message === "LOCATION_PERMISSION_DENIED") {
        setErrorMsg("Location permission denied. Please enable it in settings.");
      } else {
        setErrorMsg("Unable to refresh weather data. Please try again shortly.");
      }
    } finally {
      setLoading(false);
    }
  };

  const scrollToAmbassador = () => {
    ambassadorRef.current?.measureLayout(
      mainScrollRef.current as any,
      (x, y) => {
        mainScrollRef.current?.scrollTo({ y: y - 100, animated: true });
      },
      () => {}
    );
  };

  useEffect(() => {
    if (params.scrollToAmbassador) {
      setTimeout(() => {
        scrollToAmbassador();
      }, 500);
    }
  }, [params.scrollToAmbassador]);

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
  const timelineSidePadding = Math.max((timelineViewportWidth - TIMELINE_ITEM_WIDTH) / 2, 0);

  const centerTimelineOnNow = useCallback((animated: boolean = false) => {
    if (!weather?.hourlyUvData?.length) return;

    const nowIndex = Math.floor(weather.hourlyUvData.length / 2);
    const xOffset = nowIndex * (TIMELINE_ITEM_WIDTH + TIMELINE_ITEM_GAP);

    scrollRef.current?.scrollTo({ x: xOffset, y: 0, animated });
  }, [weather]);



  const requestPermission = async () => {
    try {
      setLoading(true);
      const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
      setPermissionStatus(status);
      if (status === 'granted') {
        loadWeather();
      }
    } catch (e) {
      console.error(e);
      setErrorMsg(t.locationPermError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWeather();
  }, []);

  useEffect(() => {
    if (!weather?.hourlyUvData?.length || timelineViewportWidth <= 0) return;

    const timer = setTimeout(() => {
      centerTimelineOnNow(false);
    }, 80);

    return () => clearTimeout(timer);
  }, [weather, timelineViewportWidth, centerTimelineOnNow]);

  useFocusEffect(
    useCallback(() => {
      if (!weather?.hourlyUvData?.length || timelineViewportWidth <= 0) return;

      const raf = requestAnimationFrame(() => {
        centerTimelineOnNow(false);
      });

      return () => cancelAnimationFrame(raf);
    }, [weather, timelineViewportWidth, centerTimelineOnNow])
  );

  useEffect(() => {
    if (params.scrollToAmbassador) {
      // Small timeout to ensure layout is ready
      setTimeout(() => {
        scrollToAmbassador();
      }, 500);
    }
  }, [params.scrollToAmbassador]);

  const getVividUvColor = (uv: number) => {
    if (uv < 3) return "#4ADE80";
    if (uv < 6) return "#FACC15";
    if (uv < 8) return "#FB923C";
    if (uv < 11) return "#F87171";
    return "#C084FC";
  };

  const getBurnRisk = (uv: number, humidity: number, clouds: number) => {
    // Skin factor: Type 1 is 1.0 (max risk), Type 6 is ~0.2 (low risk)
    const skinRiskFactor = Math.max(0.15, 1.2 - (fitzpatrickLevel || 2) * 0.18);
    
    let risk = uv * 1.2 * skinRiskFactor;
    if (humidity > 70) risk *= 1.15;
    if (clouds < 20) risk *= 1.2; 
    if (clouds > 80) risk *= 0.7; 
    
    if (risk > 10) return { label: t.extreme, color: "#EF4444", emoji: "🔥" };
    if (risk > 7) return { label: t.high, color: "#F97316", emoji: "⚠️" };
    if (risk > 4) return { label: t.moderate, color: "#FBBF24", emoji: "⚖️" };
    return { label: t.low, color: "#22C55E", emoji: "✅" };
  };

  const getUvLabel = (label: string) => {
    const key = label.toLowerCase().replace(" ", "") as keyof typeof t;
    return t[key] || label;
  };

  const getSafeWindow = (uv: number) => {
    if (uv <= 0) return "∞";
    const minutes = calculateSafeMinutes(uv, fitzpatrickLevel || 2, currentSpf);
    
    if (minutes > 240) return "∞";
    if (minutes > 60) return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
    return `${minutes}m`;
  };

  const uvInfoRaw = getUvBand(cachedCurrentUv);
  const uvInfo = { ...uvInfoRaw, label: getUvLabel(uvInfoRaw.label) };
  const maxDailyUv = weather ? Math.max(...weather.hourlyUvData, 1) : 1;
  const burnRisk = weather ? getBurnRisk(weather.currentUv, weather.humidity, weather.cloudCover) : { label: t.low, color: "#22C55E", emoji: "✅" };
  const safeWindow = getSafeWindow(cachedCurrentUv);
  const tomorrowForecast = weather?.dailyForecast[1] ?? weather?.dailyForecast[0];
  const strategyStart = tomorrowForecast?.strategyStartTime ?? tomorrowForecast?.bestStartTime ?? "--:--";
  const strategyEnd = tomorrowForecast?.strategyEndTime ?? tomorrowForecast?.bestEndTime ?? "--:--";
  const peakRainProbability = Math.round(tomorrowForecast?.peakRainProbability ?? 0);
  const strategyRainProbability = Math.round(tomorrowForecast?.strategyRainProbability ?? 0);
  const tomorrowUvMax = tomorrowForecast?.uvMax ?? 0;
  const tomorrowWeatherCode = tomorrowForecast?.weatherCode ?? 0;
  
  // Very strict recommendation: YES only if ALL conditions are optimal
  // - NO rain (0% probability)
  // - Clear/sunny (weatherCode <= 3: 0=sunny, 1=mainly clear, 2=partly cloudy, 3=overcast)
  // - UV decent (>= 3)
  const tomorrowRecommended = tomorrowForecast 
    ? (strategyRainProbability === 0 && tomorrowWeatherCode <= 2 && tomorrowUvMax >= 3)
    : false;
  const tomorrowRecommendationLabel = tomorrowRecommended ? "SÌ" : "NO";

  return (
    <GradientBackground>
      <ScrollView
        ref={mainScrollRef}
        className="flex-1"
        contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: insets.bottom + 100, paddingHorizontal: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="mb-6 flex-row items-center justify-between">
          <View>
            <Text className="text-[32px] font-black tracking-[-1.5px] text-white uppercase">HOME</Text>
            <TouchableOpacity 
              onPress={() => setLocationModalVisible(true)}
              className="flex-row items-center mt-1"
              activeOpacity={0.7}
            >
              <Text className="text-sm font-bold text-white/60">
                {loading ? t.detectingLocation : weather?.locationName || t.locationUnavailable}
              </Text>
              <View className="ml-2 h-5 w-5 items-center justify-center rounded-full bg-white/10">
                <ChevronDown size={12} color="white" />
              </View>
            </TouchableOpacity>
          </View>
          
          <View className="flex-row items-center gap-2">
            <HeaderButtons 
              onPartnerPress={scrollToAmbassador}
              onProPress={() => setPremiumVisible(true)}
            />
            <TouchableOpacity 
              onPress={() => setSettingsVisible(true)}
              className="h-10 w-10 items-center justify-center rounded-xl bg-white/10 border border-white/10"
            >
              <Settings size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {errorMsg && (
          <GlassCard style={{ padding: 16, backgroundColor: "rgba(255,59,48,0.1)", borderColor: "#FF3B30", borderWidth: 1, marginBottom: 16 }}>
            <Text className="text-center text-sm font-black tracking-[0.2px] text-[#FF3B30]">{errorMsg}</Text>
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
                     {getLocalTime()}
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
          <GlassCard style={{ padding: 20, marginBottom: 24, borderWidth: 1.5, borderColor: "#FFFFFF", backgroundColor: "rgba(0,0,0,0.7)", shadowColor: "#000", shadowOpacity: 0.6, shadowRadius: 25, elevation: 20 }}>
            <View className="flex-row items-center justify-between mb-5">
              <View>
                <Text className="text-[9px] font-black uppercase tracking-[2px] text-white/50 mb-0.5">{t.exposureSafety}</Text>
                <Text className="text-xl font-black text-white">{t.burnRiskTitle}</Text>
              </View>
              <View className="flex-row items-center px-4 py-2 rounded-2xl" style={{ backgroundColor: `${burnRisk.color}20`, borderWidth: 1, borderColor: `${burnRisk.color}40` }}>
                <Text className="text-base mr-2">{burnRisk.emoji}</Text>
                <Text className="text-base font-black" style={{ color: burnRisk.color }}>{burnRisk.label}</Text>
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
                <Text className="text-base font-black tracking-[0.5px] text-white">{t.dailyForecast}</Text>
                <Text className="mt-0.5 text-[10px] font-bold uppercase text-white/40">{t.uvProjection}</Text>
              </View>
              <View className="flex-row items-center rounded-[10px] border border-[#FFD700]/20 bg-[#FFD700]/10 px-2.5 py-1.5">
                <Sparkles size={10} color={COLORS.accentYellow} style={{ marginRight: 4 }} />
                <Text className="text-[10px] font-black tracking-[1px]" style={{ color: COLORS.accentYellow }}>
                  {t.peak} {maxDailyUv.toFixed(1)}
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
                  const nowTimelineIndex = Math.floor(weather.hourlyUvData.length / 2);
                  const isNow = index === nowTimelineIndex;
                  const utcTime = new Date();
                  const utcHours = utcTime.getUTCHours();
                  const offsetSeconds = utcOffset || 0;
                  const localHourFractional = (utcHours + offsetSeconds / 3600 + 24) % 24;
                  const localHourNow = Math.floor(localHourFractional);
                  
                  const itemHour = (localHourNow - nowTimelineIndex + index + 24) % 24;
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
              <Text className="ml-3 text-[11px] font-black text-white uppercase tracking-[1.5px]">{t.sunsetAt} {weather.sunset}</Text>
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
                <Text className="text-[9px] font-black text-white uppercase tracking-[1px] mt-1">{t.solarIntensity}</Text>
                <Text className="mt-2 text-[9px] font-bold text-accentYellow uppercase">{weather.shortwaveRadiation > 600 ? `${t.strongUv} • ${t.fastTan}` : t.lowSlow}</Text>
                <View className="mt-3 h-[3px] w-full overflow-hidden rounded bg-white/5">
                  <View style={{ height: "100%", width: `${Math.min((weather.shortwaveRadiation / 1000) * 100, 100)}%`, backgroundColor: COLORS.accentYellow }} />
                </View>
              </GlassCard>
              <GlassCard style={{ flex: 0.48, padding: 20, borderWidth: 1.5, borderColor: "#FFFFFF", backgroundColor: "rgba(0,0,0,0.7)", shadowColor: "#000", shadowOpacity: 0.6, shadowRadius: 25, elevation: 20 }}>
                <Layers size={18} color="#A78BFA" />
                <Text className="mt-3 text-[22px] font-black text-white">{Math.round((weather.diffuseRadiation / (weather.shortwaveRadiation || 1)) * 100)}%</Text>
                <Text className="text-[9px] font-black text-white uppercase tracking-[1px] mt-1">{t.reflection}</Text>
                <Text className="mt-2 text-[9px] font-bold text-[#A78BFA] uppercase">
                  {(weather.diffuseRadiation / (weather.shortwaveRadiation || 1)) * 100 < 25 
                    ? t.directOnly 
                    : (weather.diffuseRadiation / (weather.shortwaveRadiation || 1)) * 100 < 45 
                      ? t.surroundGlow 
                      : t.highReflect}
                </Text>
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
                  <Text className="text-[10px]">{t.language === 'it' ? "UI" : "IU"}</Text>
                </Text>
                <Text className="text-[9px] font-black text-white uppercase tracking-[1px] mt-1">{t.vitaminD}</Text>
                <Text className="mt-2 text-[9px] font-bold text-[#F472B6] uppercase">{dailyVitD > 5000 ? t.activeLoad : t.dailyIntake}</Text>
                <View className="mt-3 h-[3px] w-full overflow-hidden rounded bg-white/5">
                  <View style={{ height: "100%", width: `${Math.min((dailyVitD / 15000) * 100, 100)}%`, backgroundColor: "#F472B6" }} />
                </View>
              </GlassCard>
              <GlassCard style={{ flex: 0.48, padding: 20, borderWidth: 1.5, borderColor: "#FFFFFF", backgroundColor: "rgba(0,0,0,0.7)", shadowColor: "#000", shadowOpacity: 0.6, shadowRadius: 25, elevation: 20 }}>
                <Droplet size={18} color="#60A5FA" />
                <Text className="mt-3 text-[22px] font-black text-white">{dailyFluids.toFixed(2)}L</Text>
                <Text className="text-[9px] font-black text-white uppercase tracking-[1px] mt-1">{t.fluidsLost}</Text>
                <Text className="mt-2 text-[9px] font-bold text-[#60A5FA] uppercase">{dailyFluids > 1 ? t.rehydrate : t.safeLevels}</Text>
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
                  <Text className="text-[9px] font-black text-white uppercase tracking-[1px]">{t.dailyTanningGoal}</Text>
                </View>
                <Text className="mt-2 text-[9px] font-bold text-[#34D399] uppercase">{dailyProgress >= 100 ? t.goalReached : t.sessionPending}</Text>
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
                    <Text className="ml-3 text-base font-black text-white">{t.tomorrowStrategy}</Text>
                  </View>
                  {hasPremium && (
                    <View className="px-3 py-1 rounded-xl border bg-white/5 border-white/10">
                      <Text className="text-[10px] font-black uppercase text-white/50">
                        {t.optimal}
                      </Text>
                    </View>
                  )}
               </View>

               {!hasPremium ? (
                 <TouchableOpacity 
                   onPress={() => setPremiumVisible(true)}
                   className="items-center py-6"
                 >
                   <View className="h-12 w-12 bg-white/5 rounded-full items-center justify-center mb-4">
                     <Lock size={20} color={COLORS.accentYellow} />
                   </View>
                   <Text className="text-white font-black text-base mb-1">{t.unlockStrategy}</Text>
                   <Text className="text-white/50 text-xs font-bold text-center px-4">
                     {t.strategyDesc}
                   </Text>
                 </TouchableOpacity>
               ) : (
                 <View className="flex-row items-center">
                    <View className="flex-1 ml-4 pl-4 border-l border-white/10">
                       {/* Time Window at the Top */}
                       <Text className="text-[12px] font-black text-white/50 uppercase tracking-[1px] mb-1">
                          {t.bestWindow}
                       </Text>
                       <Text className="text-[18px] font-black text-white mb-3">
                          {strategyStart} - {strategyEnd}
                       </Text>

                       {/* Temp and UV in the middle row */}
                       <View className="flex-row items-center justify-between mb-3 pr-4">
                         <View>
                           <Text className="text-[24px] font-black text-white">{(tomorrowForecast?.strategyTemp ?? 0).toFixed(0)}°</Text>
                           <Text className="text-[9px] font-black text-white/30 uppercase tracking-[1px]">TEMP</Text>
                         </View>
                         <View className="items-end">
                           <Text className="text-[24px] font-black text-accentYellow">UV {(tomorrowForecast?.strategyUv ?? 0).toFixed(1)}</Text>
                           <Text className="text-[9px] font-black text-white/30 uppercase tracking-[1px]">INDEX</Text>
                         </View>
                       </View>

                       {/* Weather Description at the bottom */}
                       <View className="flex-row items-center bg-white/5 rounded-xl px-3 py-2 self-start">
                         {getWeatherIcon(tomorrowForecast?.strategyWeatherCode ?? 0, 16)}
                         <Text className="ml-2 text-[10px] font-black uppercase tracking-[1px] text-white/70">
                           {getWeatherDescription(tomorrowForecast?.strategyWeatherCode ?? 0, t)}
                         </Text>
                       </View>
                    </View>
                 </View>
               )}
            </GlassCard>
          </View>
        )}

        {/* 5. WEEKLY OUTLOOK */}
        {!loading && weather && (
          <GlassCard style={{ padding: 24, marginTop: 16, borderWidth: 1, borderColor: "#FFFFFF", backgroundColor: "rgba(0,0,0,0.7)", shadowColor: "#000", shadowOpacity: 0.6, shadowRadius: 25, elevation: 20 }}>
            <View className="mb-6 flex-row items-center justify-between">
              <View className="flex-row items-center">
                <Calendar size={18} color={COLORS.accentYellow} />
                <Text className="ml-3 text-base font-black text-white">{t.weeklyOutlook}</Text>
              </View>
            </View>
            <View className="gap-2">
              {weather.dailyForecast.map((day, idx) => (
                <View key={idx} className={`flex-row items-center justify-between py-4 ${idx < weather.dailyForecast.length - 1 ? 'border-b border-white/5' : ''}`}>
                  <Text className="flex-1 text-[15px] font-bold text-white/60">{new Date(day.date).toLocaleDateString('en-US', { weekday: 'long' })}</Text>
                  <View className="flex-row items-center flex-[1.5] justify-center">
                    {getWeatherIcon(day.weatherCode, 20)}
                    <View className="ml-4 items-center">
                      <Text className="text-[10px] font-black text-accentYellow uppercase tracking-[1px]">{t.uvPeak}</Text>
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

        <View />

        {/* Ambassador Program Section */}
        {!loading && weather && (
          <View ref={ambassadorRef}>
            <AmbassadorCard onPress={() => setAmbassadorVisible(true)} />
          </View>
        )}

        {/* Scientific Intelligence & Safety Footer */}
        {!loading && weather && (
          <View className="mt-12 mb-10 items-center px-4">
            <View className="h-[1px] w-12 bg-white/20 mb-8" />
            <View className="flex-row items-center mb-5">
              <ShieldCheck size={16} color="rgba(255,255,255,0.6)" />
              <Text className="ml-3 text-[11px] font-black uppercase tracking-[2px] text-white/50">{t.scientificIntelligence}</Text>
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
      <SettingsModal 
        visible={settingsVisible} 
        onClose={() => setSettingsVisible(false)} 
      />
      <PremiumModal visible={premiumVisible} onClose={() => setPremiumVisible(false)} />
      <AmbassadorModal visible={ambassadorVisible} onClose={() => setAmbassadorVisible(false)} />
    </GradientBackground>
  );
}
