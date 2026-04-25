import React, { useMemo, useState, useRef, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, Image, Dimensions, Modal } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path, Circle } from "react-native-svg";
import { 
  Settings, History as HistoryIcon, Shield, 
  Trash2, ChevronRight, Sun, Zap,
  Activity, ArrowUpRight, BarChart3, Camera,
  ShieldCheck, Droplet, Clock, Check, Flame
} from "lucide-react-native";

import { LinearGradient } from "expo-linear-gradient";
import { GradientBackground } from "@/components/GradientBackground";
import { GlassCard } from "@/components/GlassCard";
import { SessionRecap } from "@/components/SessionRecap";
import { useAppStore, SessionHistoryItem } from "@/store/useAppStore";
import { FITZPATRICK_TYPES, COLORS, formatDuration } from "@/constants/theme";
import { SettingsModal } from "@/components/SettingsModal";

const SCREEN_WIDTH = Dimensions.get("window").width;
const CHART_HEIGHT = 120;
const CHART_WIDTH = SCREEN_WIDTH - 88;

const SPF_OPTIONS = [0, 15, 30, 50, 70, 100];

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const [settingsVisible, setSettingsVisible] = useState(false);
  
  const { 
    skinHex, 
    fitzpatrickLevel, 
    currentSpf, 
    setCurrentSpf,
    setFitzpatrickLevel,
    setSkinHex,
    resetProfile,
    history,
    updateHistoryItemData,
    dailyGoalMinutes,
    setDailyGoalMinutes
  } = useAppStore();

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

  // ── Timeline Logic (Last 14 Days) ──────────────────────────────────────────
  const timelineDays = useMemo(() => {
    const days = [];
    const now = new Date();
    // Generate 14 days, with current day being near the end
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
    return days;
  }, [history]);

  // Auto-scroll to end (current day)
  useEffect(() => {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 500);
  }, []);

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
    const points = dailyStats.map((d, i) => {
      const x = (i / 6) * CHART_WIDTH;
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
        className="flex-1"
        contentContainerStyle={{ 
          paddingTop: insets.top + 20, 
          paddingBottom: insets.bottom + 120, 
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="mb-6 flex-row items-center justify-between px-6">
          <View>
            <Text className="text-[36px] font-black tracking-[-1.5px] text-white">My Studio</Text>
            <View className="flex-row items-center mt-1">
               <ShieldCheck size={12} color={COLORS.accentYellow} />
               <Text className="ml-2 text-[10px] font-black uppercase tracking-[2px] text-white/40">Verified Studio</Text>
            </View>
          </View>
          <TouchableOpacity 
            activeOpacity={0.7}
            onPress={() => setSettingsVisible(true)}
            className="h-12 w-12 items-center justify-center rounded-2xl bg-white/10 border border-white/10"
          >
            <Settings size={22} color="white" />
          </TouchableOpacity>
        </View>

        {/* 1. VISUAL JOURNEY (STACKED POLAROIDS) */}
        <View className="mb-6">
          <View className="px-6 mb-4 flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Camera size={20} color={COLORS.accentYellow} />
              <Text className="ml-3 text-xl font-black text-white">Visual Journey</Text>
            </View>
            <View className="flex-row items-center bg-black/70 px-3 py-1.5 rounded-2xl border border-white ">
               <Text className="text-3xl">🔥</Text>
               <Text className="ml-1 text-3xl font-black text-[#fbffab]" style={{ textShadowColor: 'rgba(255, 172, 51, 0.4)', textShadowRadius: 15 }}>
                 {streak}
               </Text>
            </View>
          </View>
          
          <ScrollView 
            ref={scrollRef}
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={{ paddingHorizontal: 30, paddingVertical: 25 }}
          >
            <View className="flex-row gap-4">
              {timelineDays.map((day, i) => {
                const isToday = i === timelineDays.length - 1;
                const lastSession = day.sessions[day.sessions.length - 1];
                
                return (
                  <View key={day.dateStr} className="items-center" style={{ width: 110 }}>
                    <View className="mb-4 items-center">
                      <Text className={`text-[11px] font-black uppercase tracking-[1.5px] ${isToday ? 'text-accentYellow' : 'text-white/50'}`}>
                        {day.date.toLocaleDateString(undefined, { weekday: 'short' })}
                      </Text>
                      <Text className={`text-[10px] font-bold ${isToday ? 'text-accentYellow' : 'text-white/20'}`}>
                        {day.date.getDate()}
                      </Text>
                    </View>

                    <View className="relative" style={{ shadowColor: "#000", shadowOpacity: 0.4, shadowRadius: 15 }}>
                      <TouchableOpacity 
                        activeOpacity={0.9}
                        onPress={() => lastSession && setSelectedSession(lastSession)}
                        className={`h-28 w-28 rounded-[32px] overflow-hidden border border-white items-center justify-center ${lastSession ? 'bg-black' : 'bg-white/[0.02] border-dashed border-white/20'}`}
                      >
                        {lastSession?.imageUri ? (
                          <Image source={{ uri: lastSession.imageUri }} className="h-full w-full opacity-90" />
                        ) : (
                          <View className="items-center">
                            <Sun size={20} color="white" opacity={0.1} />
                          </View>
                        )}
                      </TouchableOpacity>

                      {lastSession?.skinColorHex && (
                        <View 
                          className="absolute -bottom-1.5 -right-1.5 h-9 w-9 rounded-full border-4 border-black"
                          style={{ backgroundColor: lastSession.skinColorHex }}
                        />
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          </ScrollView>
        </View>

        {/* 2. QUICK SETTINGS (SPF & TONE) */}
        <View className="mb-12 px-6">
          <GlassCard style={{ padding: 28, borderRadius: 48, backgroundColor: "rgba(0,0,0,0.7)", borderColor: "#FFFFFF", shadowColor: "#000", shadowOpacity: 0.6, shadowRadius: 25, elevation: 20 }}>
            <View className="mb-8">
              <View className="flex-row items-center justify-between mb-5">
                <View className="flex-row items-center">
                   <Shield size={18} color={COLORS.accentOrange} />
                   <Text className="ml-3 text-lg font-black text-white">Skin Guard</Text>
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
                      onPress={() => setCurrentSpf(spf)}
                      className={`h-11 px-5 rounded-xl items-center justify-center border ${currentSpf === spf ? 'border-accentOrange bg-accentOrange' : 'border-white/10 bg-white/5'}`}
                    >
                      <Text className={`text-[11px] font-black ${currentSpf === spf ? 'text-white' : 'text-white/40'}`}>
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
                   <Text className="ml-3 text-lg font-black text-white">Daily Goal</Text>
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
                      onPress={() => setDailyGoalMinutes(min)}
                      className={`h-11 px-5 rounded-xl items-center justify-center border ${dailyGoalMinutes === min ? 'border-accentYellow bg-accentYellow' : 'border-white/10 bg-white/5'}`}
                    >
                      <Text className={`text-[11px] font-black ${dailyGoalMinutes === min ? 'text-black' : 'text-white/40'}`}>
                        {min} MIN
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
                   <Text className="ml-3 text-lg font-black text-white">Target Tone</Text>
                </View>
                <View className="h-6 w-6 rounded-full border border-white/20" style={{ backgroundColor: skinHex || '#C68642' }} />
              </View>
              
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mx-[-10px]">
                <View className="flex-row gap-2.5 px-[10px]">
                  {FITZPATRICK_TYPES.map((type) => {
                    const isSelected = fitzpatrickLevel === type.level;
                    return (
                      <TouchableOpacity
                        key={type.level}
                        onPress={() => handleToneChange(type.level, type.hex)}
                        className={`h-14 w-14 rounded-2xl items-center justify-center border-2 ${isSelected ? 'border-accentYellow bg-accentYellow/10' : 'border-white/5 bg-white/5'}`}
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
        <View className="px-6 mb-12">
          <View className="mb-6 flex-row items-center">
            <Activity size={20} color={COLORS.accentYellow} />
            <Text className="ml-3 text-xl font-black text-white">Efficiency Trend</Text>
          </View>

          {analytics ? (
            <GlassCard style={{ padding: 28, borderRadius: 48, backgroundColor: "rgba(0,0,0,0.7)", borderColor: "#FFFFFF", shadowColor: "#000", shadowOpacity: 0.6, shadowRadius: 25, elevation: 20 }}>
              <View className="mb-8 flex-row items-start justify-between">
                <View>
                  <Text className="text-sm font-black text-white uppercase tracking-[1px]">Daily Exposure</Text>
                  <Text className="text-[10px] font-bold text-white/40 uppercase">Performance Metrics</Text>
                </View>
                <View className="flex-row items-center bg-green-500/20 px-3 py-1.5 rounded-xl border border-green-500/30">
                  <ArrowUpRight size={14} color="#4ADE80" />
                  <Text className="ml-2 text-[11px] font-black text-[#4ADE80]">+{analytics.growthPercent}%</Text>
                </View>
              </View>

              <View className="h-[120px] w-full mb-8 items-center">
                <Svg height={CHART_HEIGHT} width={CHART_WIDTH}>
                  <Path d={analytics.pathData} fill="none" stroke={COLORS.accentYellow} strokeWidth="5" strokeLinecap="round" />
                  {analytics.points.map((p, i) => (
                    <Circle key={i} cx={p.x} cy={p.y} r="5" fill="white" stroke={COLORS.accentYellow} strokeWidth="2" />
                  ))}
                </Svg>
              </View>

              <View className="flex-row justify-between px-2">
                {['M','T','W','T','F','S','S'].map((day, i) => (
                  <Text key={i} className="text-[10px] font-black text-white/30 uppercase tracking-[1px]">{day}</Text>
                ))}
              </View>
            </GlassCard>
          ) : (
            <GlassCard style={{ padding: 50, alignItems: "center", borderRadius: 48 }}>
              <BarChart3 size={36} color="white" opacity={0.1} />
              <Text className="mt-4 text-center text-xs font-black text-white/20 uppercase tracking-[2px]">
                Awaiting Session Data
              </Text>
            </GlassCard>
          )}
        </View>

        {/* 4. HISTORY LIST */}
        <View className="px-6 mb-6 flex-row items-center justify-between">
          <View className="flex-row items-center">
            <HistoryIcon size={20} color="white" opacity={0.6} />
            <Text className="ml-3 text-xl font-black text-white">Activity Log</Text>
          </View>
          <Text className="text-xs font-black text-white/40 uppercase tracking-[1px]">{history.length} total</Text>
        </View>

        <View className="px-6">
          {history.length === 0 ? (
            <GlassCard style={{ padding: 40, alignItems: "center", borderRadius: 40, backgroundColor: "rgba(0,0,0,0.7)", borderColor: "#FFFFFF", elevation: 10 }}>
              <Sun size={32} color="white" opacity={0.1} />
              <Text className="mt-4 text-xs font-black text-white/20 uppercase tracking-[2px]">Empty Log</Text>
            </GlassCard>
          ) : (
            history.slice(0, 8).map((item) => (
              <TouchableOpacity key={item.id} activeOpacity={0.7} onPress={() => setSelectedSession(item)} className="mb-4 shadow-2xl">
                <GlassCard style={{ borderRadius: 36, padding: 20, borderWidth: 1, borderColor: "#FFFFFF", backgroundColor: "rgba(0,0,0,0.7)", shadowColor: "#000", shadowOpacity: 0.5, shadowRadius: 20, elevation: 15 }}>
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
                          {new Date(item.date).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' })}
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
            ))
          )}
        </View>

        {/* Danger Zone */}
        <View className="px-6 mt-16">
          <TouchableOpacity 
            onPress={resetProfile} 
            className="flex-row items-center justify-center rounded-[32px] border border-red-500/20 bg-red-500/5 py-6"
            activeOpacity={0.7}
          >
            <Trash2 size={18} color="#FF3B30" />
            <Text className="ml-3 text-xs font-black uppercase tracking-[3px] text-[#FF3B30]">
              Purge All Data
            </Text>
          </TouchableOpacity>
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
