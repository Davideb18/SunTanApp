import React, { useMemo, useState, useRef, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, Image, Dimensions, Modal, Share } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path, Circle } from "react-native-svg";
import { 
  Settings, History as HistoryIcon, Shield, 
  Trash2, ChevronRight, Sun, Zap,
  Activity, ArrowUpRight, BarChart3, Camera,
  ShieldCheck, Droplet, Clock, Check, Flame, Bell, Lock, X, Image as ImageIcon, Gift
} from "lucide-react-native";

import { LinearGradient } from "expo-linear-gradient";
import { GradientBackground } from "@/components/GradientBackground";
import { GlassCard } from "@/components/GlassCard";
import { SessionRecap } from "@/components/SessionRecap";
import { HeaderButtons } from "../../components/HeaderButtons";
import { useAppStore, SessionHistoryItem } from "@/store/useAppStore";
import { FITZPATRICK_TYPES, COLORS, formatDuration } from "@/constants/theme";
import { SettingsModal } from "@/components/SettingsModal";
import { schedulePhaseEndNotification, scheduleSafetyAlert } from "@/utils/notifications";
import { useTranslation } from "@/constants/i18n";

const SCREEN_WIDTH = Dimensions.get("window").width;
const CHART_HEIGHT = 150;
const CHART_WIDTH = SCREEN_WIDTH - 100;

const SPF_OPTIONS = [0, 15, 30, 50];

export default function ProfileScreen() {
  const t = useTranslation();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const visualJourneyRef = useRef<ScrollView>(null);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const setPremiumVisible = useAppStore(s => s.setPremiumVisible);
  const setAmbassadorVisible = useAppStore(s => s.setAmbassadorVisible);
  const skinHex = useAppStore(s => s.skinHex);
  const setSkinHex = useAppStore(s => s.setSkinHex);
  const fitzpatrickLevel = useAppStore(s => s.fitzpatrickLevel);
  const setFitzpatrickLevel = useAppStore(s => s.setFitzpatrickLevel);
  const currentSpf = useAppStore(s => s.currentSpf);
  const history = useAppStore(s => s.history);
  const updateHistoryItemData = useAppStore(s => s.updateHistoryItemData);
  const dailyGoalMinutes = useAppStore(s => s.dailyGoalMinutes);
  const vitDGoalIU = useAppStore(s => s.vitDGoalIU);
  const hasPremium = useAppStore(s => s.hasPremium);
  const resetProfile = useAppStore(s => s.resetProfile);

  const weeklyVitD = useMemo(() => {
    return history
      .filter(s => (new Date().getTime() - new Date(s.date).getTime()) <= 7 * 24 * 60 * 60 * 1000)
      .reduce((acc, s) => acc + (s.vitD || 0), 0);
  }, [history]);

  const toneStart = history.length > 0 ? history[history.length - 1].skinColorHex || skinHex || '#C68642' : skinHex || '#C68642';
  const toneEnd = history.length > 0 ? history[0].skinColorHex || toneStart : toneStart;

  const [selectedSession, setSelectedSession] = useState<SessionHistoryItem | null>(null);

  const GOAL_OPTIONS = [20, 30, 40, 60, 90];

  // ── Streak Logic ──────────────────────────────────────────────────────────
  const streak = useMemo(() => {
    if (history.length === 0) return 0;
    const sortedDates = [...new Set(history.map(s => s.date.split('T')[0]))].sort().reverse();
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    if (sortedDates[0] !== today && sortedDates[0] !== yesterdayStr) return 0;
    let count = 0;
    let checkDate = new Date(sortedDates[0]);
    for (const dateStr of sortedDates) {
      const currentCheckStr = checkDate.toISOString().split('T')[0];
      if (dateStr === currentCheckStr) {
        count++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    return count;
  }, [history]);

  const timelineDays = useMemo(() => {
    const days = [];
    const now = new Date();
    // Generate 14 days, with current day being last (right-most)
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const daySessions = history.filter(s => s.date.startsWith(dateStr));
      days.push({
        date: d,
        dateStr,
        sessions: daySessions
      });
    }
    
    // PREMIUM LOCK: Only show last 3 days if not premium
    if (!hasPremium) {
      return days.map((day, idx) => {
         // The last 3 items in the array are the last 3 days
         if (idx < days.length - 3) {
            return { ...day, sessions: [] }; // Hide sessions older than 3 days
         }
         return day;
      });
    }
    
    return days;
  }, [history, hasPremium]);

  // ── Analytics Logic ──────────────────────────────────────────────────────
  const analytics = useMemo(() => {
    if (history.length === 0) return null;
    const last7Days = timelineDays.slice(-7);
    const dailyStats = last7Days.map(d => {
      const totalSec = d.sessions.reduce((acc, s) => acc + s.totalSeconds, 0);
      return { date: d.dateStr, seconds: totalSec };
    });
    const maxSeconds = Math.max(...dailyStats.map(d => d.seconds), 1800);
    const PADDING_Y = 12;
    const PADDING_X = 10;
    const points = dailyStats.map((d, i) => {
      const x = PADDING_X + (i / 6) * (CHART_WIDTH - 2 * PADDING_X);
      const y = (CHART_HEIGHT - PADDING_Y) - (d.seconds / maxSeconds) * (CHART_HEIGHT - 2 * PADDING_Y);
      return { x, y };
    });
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cpX = (p0.x + p1.x) / 2;
      d += ` C ${cpX} ${p0.y}, ${cpX} ${p1.y}, ${p1.x} ${p1.y}`;
    }
    return { dailyStats, maxSeconds, pathData: d, points, growthPercent: history.length > 2 ? 14 : 0 };
  }, [history, timelineDays]);

  const handleToneChange = (level: number, hex: string) => {
    setFitzpatrickLevel(level);
    setSkinHex(hex);
  };

  return (
    <GradientBackground>
      <ScrollView
        ref={scrollRef}
        className="flex-1"
        contentContainerStyle={{ 
          paddingTop: insets.top + 20, 
          paddingBottom: insets.bottom + 120, 
          paddingHorizontal: 24 
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="mb-8 flex-row items-center justify-between">
          <View>
            <Text className="text-[24px] font-black tracking-[-0.5px] text-white">{t.myStudio}</Text>
            <Text className="mt-1 text-xs font-bold uppercase tracking-[2px] text-white/50">
              {streak > 0 ? `${streak} ${t.dayStreak} 🔥` : t.startJourney}
            </Text>
          </View>

          <View className="flex-row items-center gap-2">
            <HeaderButtons 
              onPartnerPress={() => setAmbassadorVisible(true)}
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

        <View />

        {/* 1. VISUAL JOURNEY (STACKED POLAROIDS) */}
        <View className="mb-10">
          <View className="mb-2 flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Camera size={20} color={COLORS.accentYellow} />
              <Text className="ml-3 text-xl font-black text-white">{t.visualJourney}</Text>
            </View>
            <View className="flex-row items-center bg-black/40 px-3 py-1.5 rounded-2xl border border-white/10">
               <Text className="text-3xl">🔥</Text>
               <Text className="ml-1 text-3xl font-black text-[#fbffab]" style={{ textShadowColor: 'rgba(255, 172, 51, 0.4)', textShadowRadius: 15 }}>
                 {streak}
               </Text>
            </View>
          </View>
          
          {!hasPremium ? (
            // LOCKED TEASER
            <TouchableOpacity 
              onPress={() => setPremiumVisible(true)}
              activeOpacity={0.9}
              className="w-full h-48 rounded-[40px] overflow-hidden border-[3px] border-white bg-white/5 items-center justify-center shadow-2xl"
            >
              <LinearGradient
                colors={['rgba(0,0,0,0.5)', 'rgba(0,0,0,0.95)']}
                className="absolute inset-0"
              />
              <View className="absolute top-4 right-6 bg-accentYellow px-3 py-1.5 rounded-full border border-white/20">
                <Text className="text-[10px] font-black text-black">GLOWY PRO</Text>
              </View>
              <View className="items-center justify-center">
                <View className="h-20 w-20 rounded-full bg-white/10 border-2 border-white/30 items-center justify-center mb-5">
                  <Lock size={32} color="white" />
                </View>
                <Text className="text-lg font-black text-white uppercase tracking-[3px] text-center">{t.visualJourney}</Text>
                <Text className="text-[11px] font-bold text-accentYellow uppercase mt-2 tracking-[1.5px] italic text-center">
                  {t.language === "it" ? "SBLOCCA TUTTA LA CRONOLOGIA\nCON PREMIUM" : t.unlockHistory}
                </Text>
              </View>
            </TouchableOpacity>
          ) : (
            <ScrollView 
              ref={visualJourneyRef}
              onContentSizeChange={() => visualJourneyRef.current?.scrollToEnd({ animated: false })}
              horizontal 
              showsHorizontalScrollIndicator={false} 
              contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 8, paddingBottom: 24 }}
              style={{ marginHorizontal: -24 }}
            >
              <View className="flex-row gap-4 px-2">
                  {timelineDays.map((day, i) => {
                    const isToday = i === timelineDays.length - 1;
                    const lastSession = day.sessions[day.sessions.length - 1];
                    
                    return (
                      <View key={day.dateStr} className="items-center" style={{ width: 85 }}>
                        <View className="mb-3 items-center">
                          <Text className={`text-[9px] font-black uppercase tracking-[1.5px] ${isToday ? 'text-accentYellow' : 'text-white/50'}`}>
                            {isToday ? (t.language === 'it' ? 'Oggi' : 'Today') : day.date.toLocaleDateString(t.language === 'it' ? 'it-IT' : 'en-US', { weekday: 'short' })}
                          </Text>
                          <Text className={`text-[11px] font-bold mt-0.5 ${isToday ? 'text-accentYellow' : 'text-white/20'}`}>
                            {day.date.getDate()}
                          </Text>
                        </View>
  
                        <View className="relative" style={{ shadowColor: "#000", shadowOpacity: 0.4, shadowRadius: 15 }}>
                          <TouchableOpacity 
                            activeOpacity={0.9}
                            onPress={() => lastSession && setSelectedSession(lastSession)}
                            className={`h-20 w-20 rounded-[24px] overflow-hidden border items-center justify-center ${lastSession ? 'bg-black border-white' : 'bg-white/10 border-white/30'}`}
                          >
                            {lastSession?.imageUri ? (
                              <Image source={{ uri: lastSession.imageUri }} className="h-full w-full opacity-90" />
                            ) : (
                              <View className="items-center">
                                <Sun size={16} color="white" opacity={0.3} />
                              </View>
                            )}
                          </TouchableOpacity>
  
                          {lastSession?.skinColorHex && (
                            <View 
                              className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full border-[3px] border-black"
                              style={{ backgroundColor: lastSession.skinColorHex }}
                            />
                          )}
                        </View>
                      </View>
                    );
                  })}
                </View>
              </ScrollView>
          )}
        </View>

        {/* 2. QUICK SETTINGS (SPF & TONE) */}
        <View className="mb-12">
          <GlassCard style={{ padding: 22, borderRadius: 48, width: "100%", backgroundColor: "rgba(0,0,0,0.7)", borderWidth: 2, borderColor: "#FFFFFF", shadowColor: "#000", shadowOpacity: 0.6, shadowRadius: 25, elevation: 20 }}>
            <View className="mb-8">
              <View className="flex-row items-center justify-between mb-5">
                <View className="flex-row items-center">
                   <Shield size={18} color={COLORS.accentOrange} />
                   <Text className="ml-3 text-lg font-black text-white">{t.skinHealth}</Text>
                </View>
                <View className="bg-accentOrange/20 px-3 py-1 rounded-lg border border-accentOrange/30">
                  <Text className="text-[10px] font-black text-accentOrange">SPF {currentSpf}</Text>
                </View>
              </View>
              
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mx-[-10px]">
                <View className="flex-row gap-2.5 px-[10px]">
                  {SPF_OPTIONS.map((spf) => (
                    <TouchableOpacity
                      key={spf}
                      onPress={() => {
                        useAppStore.getState().setCurrentSpf(spf);
                      }}
                      style={{
                        backgroundColor: currentSpf === spf ? COLORS.accentOrange : "rgba(255,255,255,0.05)",
                        borderColor: currentSpf === spf ? COLORS.accentOrange : "rgba(255,255,255,0.1)",
                      }}
                      className="h-11 px-5 rounded-xl items-center justify-center border"
                    >
                      <Text className={`text-[11px] font-black ${currentSpf === spf ? 'text-black' : 'text-white/40'}`}>
                        {spf === 0 ? "OFF" : `SPF ${spf}`}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            <View className="mb-8">
              <View className="flex-row items-center justify-between mb-5">
                <View className="flex-row items-center">
                   <Clock size={18} color={COLORS.accentYellow} />
                   <Text className="ml-3 text-lg font-black text-white">{t.dailyTanningGoal}</Text>
                </View>
                <View className="bg-accentYellow/20 px-3 py-1 rounded-lg border border-accentYellow/30">
                  <Text className="text-[10px] font-black text-accentYellow">{dailyGoalMinutes} MIN</Text>
                </View>
              </View>
              
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mx-[-10px]">
                <View className="flex-row gap-2.5 px-[10px]">
                  {GOAL_OPTIONS.map((min) => (
                    <TouchableOpacity
                      key={min}
                      onPress={() => {
                        useAppStore.getState().setDailyGoalMinutes(min);
                      }}
                      style={{
                        backgroundColor: dailyGoalMinutes === min ? COLORS.accentYellow : "rgba(255,255,255,0.05)",
                        borderColor: dailyGoalMinutes === min ? COLORS.accentYellow : "rgba(255,255,255,0.1)",
                      }}
                      className="h-16 px-8 rounded-[24px] items-center justify-center border"
                    >
                      <Text className={`text-[17px] font-black ${dailyGoalMinutes === min ? 'text-black' : 'text-white/40'}`}>
                        {min}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            <View>
              <View className="flex-row items-center justify-between mb-5">
                <View className="flex-row items-center">
                   <Zap size={18} color={COLORS.accentYellow} />
                   <Text className="ml-3 text-lg font-black text-white">{t.yourSkinTone}</Text>
                </View>
                <View className="bg-white/10 px-3 py-1 rounded-lg border border-white/20">
                  <Text className="text-[10px] font-black text-white">{t.language === 'it' ? "TEMPO BASE" : "BASE TIMER"}</Text>
                </View>
              </View>
              
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mx-[-10px]">
                <View className="flex-row gap-2.5 px-[10px]">
                  {FITZPATRICK_TYPES.map((type) => {
                    const isSelected = fitzpatrickLevel === type.level;
                    return (
                      <TouchableOpacity
                        key={type.level}
                        onPress={() => handleToneChange(type.level, type.hex)}
                        className={`h-14 w-14 rounded-2xl items-center justify-center border-2 ${isSelected ? 'border-accentYellow bg-accentYellow' : 'border-white/5 bg-white/5'}`}
                      >
                        <View className="h-8 w-8 rounded-full border border-white/20" style={{ backgroundColor: type.hex }} />
                        {isSelected && (
                          <View className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-accentYellow items-center justify-center">
                            <Check size={10} color="black" strokeWidth={4} />
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
            </View>
          </GlassCard>
        </View>

        {/* 3. ANALYTICS SECTION */}
        <View className="mb-12">
          <View className="mb-6 flex-row items-center">
            <Activity size={20} color={COLORS.accentYellow} />
            <Text className="ml-3 text-xl font-black text-white">{t.efficiencyTrend}</Text>
          </View>

          {analytics ? (
            <GlassCard style={{ padding: 22, borderRadius: 48, width: "100%", borderWidth: 2, backgroundColor: "rgba(0,0,0,0.7)", borderColor: "#FFFFFF", shadowColor: "#000", shadowOpacity: 0.6, shadowRadius: 25, elevation: 20 }}>
              <View className="mb-8 flex-row items-start justify-between">
                <View>
                  <Text className="text-sm font-black text-white uppercase tracking-[1px]">{t.dailyExposure}</Text>
                  <Text className="text-[10px] font-bold text-white/40 uppercase">{t.performanceMetrics}</Text>
                </View>
                <View className="flex-row items-center bg-green-500/20 px-3 py-1.5 rounded-xl border border-green-500/30">
                  <ArrowUpRight size={14} color="#4ADE80" />
                  <Text className="ml-2 text-[11px] font-black text-[#4ADE80]">+{analytics.growthPercent}%</Text>
                </View>
              </View>

              <View className="h-[150px] w-full mb-6 items-center">
                <Svg height={CHART_HEIGHT} width={CHART_WIDTH}>
                  <Path d={analytics.pathData} fill="none" stroke={COLORS.accentYellow} strokeWidth="5" strokeLinecap="round" />
                  {analytics.points.map((p, i) => (
                    <Circle key={i} cx={p.x} cy={p.y} r="5" fill="white" stroke={COLORS.accentYellow} strokeWidth="2" />
                  ))}
                </Svg>
              </View>

              <View className="w-full mb-4 items-center">
                <View style={{ width: CHART_WIDTH, height: 16, position: 'relative' }}>
                  {analytics.points.map((p, i) => {
                    const dayName = timelineDays.slice(-7)[i].date.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0);
                    return (
                      <Text 
                        key={i} 
                        style={{ position: 'absolute', left: p.x - 10, textAlign: 'center', width: 20 }} 
                        className="text-[10px] font-black text-white/30 uppercase tracking-[1px]"
                      >
                        {dayName}
                      </Text>
                    );
                  })}
                </View>
              </View>

              <View className="border-t border-white/10 pt-5 mt-2">
                <View className="flex-row justify-between mb-2">
                   <View className="flex-1 items-center border-r border-white/10 px-2">
                      <View className="h-8 w-8 rounded-full bg-accentYellow/10 items-center justify-center mb-2">
                        <Zap size={14} color={COLORS.accentYellow} />
                      </View>
                      <Text className="text-[10px] font-black uppercase tracking-[2px] text-white/40 mb-1 text-center">{t.efficiencyTrend}</Text>
                      <Text className="text-[15px] font-black text-accentYellow text-center">{t.optimal}</Text>
                   </View>
                   <View className="flex-1 items-center px-2">
                      <View className="h-8 w-8 rounded-full bg-accentOrange/10 items-center justify-center mb-2">
                        <Shield size={14} color={COLORS.accentOrange} />
                      </View>
                      <Text className="text-[10px] font-black uppercase tracking-[1.5px] text-white/40 mb-1 text-center">{t.skinHealth}</Text>
                      <Text className="text-[15px] font-black text-accentOrange text-center">98% {t.recovered}</Text>
                   </View>
                </View>
              </View>
            </GlassCard>
          ) : (
            <GlassCard style={{ padding: 50, alignItems: "center", borderRadius: 48, width: "100%", borderWidth: 1.5, backgroundColor: "rgba(0,0,0,0.7)", borderColor: "#FFFFFF", shadowColor: "#000", shadowOpacity: 0.6, shadowRadius: 25, elevation: 20 }}>
              <BarChart3 size={36} color="white" opacity={0.1} />
              <Text className="mt-4 text-center text-xs font-black text-white/20 uppercase tracking-[2px]">
                {t.awaitingData}
              </Text>
            </GlassCard>
          )}
        </View>

        {/* 3.5. PREMIUM BIOMETRICS */}
        <View className="mb-12">
          <View className="mb-6 flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Zap size={20} color={COLORS.accentYellow} />
              <View className="ml-3">
                <Text className="text-xl font-black text-white">{t.biometricsVault}</Text>
              </View>
            </View>
            <View className={`px-3 py-1 rounded-lg border ${hasPremium ? 'bg-accentYellow/15 border-accentYellow/30' : 'bg-white/10 border-white/20'}`}>
              <Text className={`text-[10px] font-black ${hasPremium ? 'text-accentYellow' : 'text-white'}`}>
                {hasPremium ? (t.language === 'it' ? 'SBLOCCATO' : 'UNLOCKED') : 'PRO'}
              </Text>
            </View>
          </View>

           {!hasPremium ? (
            // Locked teaser identical to Visual Journey
            <TouchableOpacity 
              onPress={() => setPremiumVisible(true)}
              activeOpacity={0.9}
              className="w-full h-48 rounded-[40px] overflow-hidden border-[3px] border-white bg-white/5 items-center justify-center shadow-2xl"
            >
              <LinearGradient
               colors={['rgba(0,0,0,0.5)', 'rgba(0,0,0,0.95)']}
               className="absolute inset-0"
              />
              <View className="absolute top-4 right-6 bg-accentYellow px-3 py-1.5 rounded-full border border-white/20">
               <Text className="text-[10px] font-black text-black">GLOWY PRO</Text>
              </View>
              <View className="items-center justify-center">
               <View className="h-20 w-20 rounded-full bg-white/10 border-2 border-white/30 items-center justify-center mb-5">
                <Lock size={32} color="white" />
               </View>
               <Text className="text-lg font-black text-white uppercase tracking-[3px] text-center">{t.biometricsVault}</Text>
               <Text className="text-[11px] font-bold text-accentYellow uppercase mt-2 tracking-[1.5px] italic text-center">{t.language === "it" ? "SBLOCCA CON PREMIUM" : t.unlockHistory}</Text>
              </View>
            </TouchableOpacity>
           ) : (
            // Full biometrics card for premium users
            <GlassCard style={{ padding: 22, borderRadius: 48, width: "100%", borderWidth: 2, backgroundColor: "rgba(0,0,0,0.7)", borderColor: "#FFFFFF", shadowColor: "#000", shadowOpacity: 0.6, shadowRadius: 25, elevation: 20 }}>
            {/* Vitamin D Section */}
            <View className="mb-8">
              <View className="mb-4">
                <View className="flex-row items-center mb-1.5">
                  <Sun size={16} color={COLORS.accentYellow} />
                  <Text className="ml-2 text-sm font-black text-white uppercase tracking-[1px]">{t.vitDSynthesis}</Text>
                </View>
                <Text className="text-[13px] font-black text-accentYellow">{vitDGoalIU > 0 ? Math.round((weeklyVitD / vitDGoalIU) * 100) : 0}% {t.ofGoal}</Text>
              </View>
              <View className="h-4 w-full bg-white/10 rounded-full overflow-hidden mb-3">
                <LinearGradient
                  colors={['#FACC15', '#FB923C']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={{ width: `${Math.min(100, vitDGoalIU > 0 ? (weeklyVitD / vitDGoalIU) * 100 : 0)}%`, height: '100%' }}
                />
              </View>
              <Text className="text-right text-[10px] font-bold text-white/40 uppercase tracking-[1px]">{weeklyVitD.toLocaleString()} / {vitDGoalIU.toLocaleString()} {t.language === 'it' ? "UI" : "IU"}</Text>
            </View>

            {/* Tone Evolution Section */}
            <View>
              <View className="flex-row items-center justify-between mb-4">
                <View className="flex-row items-center">
                  <Check size={16} color={COLORS.accentOrange} />
                  <Text className="ml-2 text-sm font-black text-white uppercase tracking-[1px]">{t.toneEvolution}</Text>
                </View>
                <Text className="text-[11px] font-black text-accentOrange">{t.baselineVsCurrent}</Text>
              </View>
              <View className="flex-row items-center justify-between bg-white/5 p-4 rounded-3xl border border-white/10">
                <View className="items-center">
                  <View className="h-12 w-12 rounded-full border-2 border-white/20 mb-2" style={{ backgroundColor: toneStart }} />
                  <Text className="text-[9px] font-black uppercase tracking-[1.5px] text-white/40">{t.baseline}</Text>
                </View>
                 
                <View className="flex-1 items-center px-4">
                  <View className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                    <LinearGradient
                      colors={[toneStart, toneEnd]}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                      style={{ width: '100%', height: '100%' }}
                    />
                  </View>
                  <Text className="mt-3 text-[10px] font-black uppercase tracking-[2px] text-white/40">{t.progression}</Text>
                </View>

                <View className="items-center">
                  <View className="h-12 w-12 rounded-full border-2 border-accentYellow mb-2" style={{ backgroundColor: toneEnd }} />
                  <Text className="text-[9px] font-black uppercase tracking-[1.5px] text-accentYellow">{t.currentLabel}</Text>
                </View>
              </View>
            </View>
           </GlassCard>
           )}
        </View>

        {/* 4. HISTORY LIST */}
        <View className="mb-6 flex-row items-center justify-between">
          <View className="flex-row items-center">
            <HistoryIcon size={20} color="white" opacity={0.6} />
            <Text className="ml-3 text-xl font-black text-white">{t.activityLog}</Text>
          </View>
          <Text className="text-xs font-black text-white/40 uppercase tracking-[1px]">{history.length} {t.totalLabel}</Text>
        </View>

        <View>
          {history.length === 0 ? (
            <GlassCard style={{ padding: 40, alignItems: "center", borderRadius: 40, width: "100%", borderWidth: 1.5, backgroundColor: "rgba(0,0,0,0.7)", borderColor: "#FFFFFF", shadowColor: "#000", shadowOpacity: 0.6, shadowRadius: 25, elevation: 20 }}>
              <Sun size={32} color="white" opacity={0.1} />
              <Text className="mt-4 text-center text-xs font-black text-white/20 uppercase tracking-[2px]">{t.emptyLog}</Text>
            </GlassCard>
          ) : (
            <>
              {/* Visible sessions: max 3 for free users */}
              {(hasPremium ? history : history.slice(0, 3)).map((item) => (
                <TouchableOpacity key={item.id} activeOpacity={0.7} onPress={() => setSelectedSession(item)} className="mb-4 shadow-2xl">
                  <GlassCard style={{ borderRadius: 36, padding: 20, width: "100%", borderWidth: 1.5, borderColor: "#FFFFFF", backgroundColor: "rgba(0,0,0,0.7)", shadowColor: "#000", shadowOpacity: 0.6, shadowRadius: 25, elevation: 20 }}>
                    <View className="flex-row items-center">
                      <View 
                        className="h-16 w-16 items-center justify-center rounded-[22px] bg-black/40 border-2 overflow-hidden"
                        style={{ borderColor: item.skinColorHex || 'rgba(255,255,255,0.1)' }}
                      >
                         {item.imageUri ? (
                           <Image source={{ uri: item.imageUri }} className="h-full w-full" />
                         ) : (
                           <Sun size={24} color={COLORS.accentYellow} opacity={0.3} />
                         )}
                      </View>
                      <View className="ml-5 flex-1">
                        <View className="flex-row items-center mb-1">
                          <Clock size={12} color="white" opacity={0.3} />
                          <Text className="ml-2 text-[11px] font-black text-white/40 uppercase tracking-[1.5px]">
                            {new Date(item.date).toLocaleDateString(t.language === 'it' ? 'it-IT' : 'en-US', { weekday: 'short', day: 'numeric' })}
                          </Text>
                        </View>
                        <Text className="text-[22px] font-black text-white tracking-[-0.5px]">{formatDuration(item.totalSeconds)}</Text>
                      </View>
                      <View className="mr-4 items-end">
                         <View className="flex-row items-center bg-white/5 px-2 py-1 rounded-lg">
                            <Droplet size={10} color="#60A5FA" />
                            <Text className="ml-1.5 text-[10px] font-black text-white/60">{item.sweatMl}ml</Text>
                         </View>
                         <View className="flex-row items-center bg-white/5 px-2 py-1 rounded-lg mt-1.5">
                            <Sun size={10} color={COLORS.accentYellow} />
                            <Text className="ml-1.5 text-[10px] font-black text-white/60">UV {item.uvIndex}</Text>
                         </View>
                      </View>
                      <ChevronRight size={18} color="white" opacity={0.2} />
                    </View>
                  </GlassCard>
                </TouchableOpacity>
              ))}

              {/* PREMIUM TEASER: Single unlock premium box for free users */}
              {!hasPremium && history.length > 0 && (
                <TouchableOpacity 
                  onPress={() => setPremiumVisible(true)}
                  activeOpacity={0.7}
                  className="mb-6 shadow-2xl"
                >
                  <LinearGradient
                    colors={['rgba(90, 90, 90, 0.9)', 'rgba(50, 50, 50, 0.8)']}
                    start={{ x: 0, y: 0 }} 
                    end={{ x: 1, y: 1 }}
                    style={{ borderRadius: 36, padding: 20, borderWidth: 1.5, borderColor: 'rgba(140, 140, 140, 0.35)' }}
                  >
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center flex-1">
                        <View className="h-16 w-16 items-center justify-center rounded-[22px] bg-white/15 border-2 border-white/25">
                          <Lock size={24} color="white" opacity={0.6} />
                        </View>
                        <View className="ml-5">
                          <Text className="text-[12px] font-black text-white/65 uppercase tracking-[1px]">{t.language === 'it' ? 'Sblocca Premium' : 'Unlock Premium'}</Text>
                          <Text className="text-[16px] font-black text-white mt-1">{t.language === 'it' ? 'Tutte le Sessioni' : 'All Sessions'}</Text>
                        </View>
                      </View>
                      <ChevronRight size={20} color="rgba(255, 255, 255, 0.25)" />
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>

        {/* 5. INVITE FRIENDS */}
        <View className="mt-12">
          <GlassCard style={{ padding: 0, borderRadius: 48, width: "100%", backgroundColor: "rgba(0,0,0,0.7)", borderWidth: 2, borderColor: "#FFFFFF", shadowColor: "#000", shadowOpacity: 0.6, shadowRadius: 25, elevation: 20, overflow: 'hidden' }}>
            <Image source={require("@/assets/shared.png")} className="absolute h-full w-full opacity-30" resizeMode="cover" />
            <LinearGradient colors={['transparent', 'rgba(0,0,0,0.9)']} className="absolute inset-0" />
            
            <View className="items-center p-10">
              <View className="h-16 w-16 bg-white/10 rounded-full items-center justify-center mb-6 border border-white/20">
                <Gift size={32} color={COLORS.accentYellow} />
              </View>
              <Text className="text-2xl font-black text-white mb-2 italic text-center tracking-[-0.5px]">{t.shareGlowy}</Text>
              <Text className="text-sm font-bold text-white/60 text-center mb-8 px-6 leading-5">
                {t.shareDesc}
              </Text>
              <TouchableOpacity 
                onPress={async () => {
                  try {
                    await Share.share({
                      message: t.shareMessage,
                    });
                  } catch (e) { console.error(e); }
                }}
                className="w-full bg-accentYellow py-5 rounded-[24px] items-center justify-center shadow-2xl shadow-accentYellow/40"
              >
                <Text className="text-base font-black text-black uppercase tracking-[2px]">{t.shareWithFriends}</Text>
              </TouchableOpacity>
            </View>
          </GlassCard>
        </View>



      </ScrollView>

      {/* SESSION DETAIL MODAL */}
      <Modal visible={!!selectedSession} animationType="slide" transparent={true} onRequestClose={() => setSelectedSession(null)}>
        <View className="flex-1 bg-black/90">
          <GradientBackground>
            <ScrollView className="flex-1" contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: insets.bottom + 40, paddingHorizontal: 24 }}>
              {selectedSession && (
                <SessionRecap 
                  session={selectedSession as any}
                  onClose={() => setSelectedSession(null)}
                  isPremium={hasPremium}
                  onUpgrade={() => { setSelectedSession(null); setTimeout(() => setPremiumVisible(true), 300); }}
                  onUpdateImage={(uri, color) => {
                    if (selectedSession.id) {
                      updateHistoryItemData(selectedSession.id, { imageUri: uri, skinColorHex: color });
                      setSelectedSession({ ...selectedSession, imageUri: uri, skinColorHex: color });
                    }
                  }}
                />
              )}
            </ScrollView>
          </GradientBackground>
        </View>
      </Modal>

      <SettingsModal 
        visible={settingsVisible} 
        onClose={() => setSettingsVisible(false)} 
      />
    </GradientBackground>
  );
}
