/**
 * Weather Screen — app/(tabs)/weather.tsx
 *
 * Displays live UV index data fetched from Open-Meteo using the
 * device's GPS coordinates. Shows a horizontal timeline of UV bars
 * similar to Apple Weather.
 */
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Location from "expo-location";
import { Clock, Droplet, Dna, TrendingUp, Sparkles } from "lucide-react-native";

import { GradientBackground } from "@/components/GradientBackground";
import { GlassCard } from "@/components/GlassCard";
import { useAppStore } from "@/store/useAppStore";
import { getUvBand, COLORS } from "@/constants/theme";

// (Redundant local definitions removed)

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------

export default function WeatherScreen() {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const scrollRef = React.useRef<ScrollView>(null);
  
  // Use selective subscription for stability
  const cachedCurrentUv = useAppStore((state) => state.cachedCurrentUv);
  const locationName = useAppStore((state) => state.locationName);
  const hourlyUvData = useAppStore((state) => state.hourlyUvData);
  const setWeatherData = useAppStore((state) => state.setWeatherData);
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchWeather();
  }, []);

  const fetchWeather = async () => {
    setLoading(true);
    setErrorMsg(null);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg("Permission denied");
        setLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      const geocode = await Location.reverseGeocodeAsync({ latitude, longitude });
      const city = geocode[0]?.city || geocode[0]?.region || "Your Location";

      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=uv_index&current_weather=true&timezone=auto&past_days=1&forecast_days=2`
      );
      const data = await response.json();

      if (data.hourly && data.hourly.uv_index) {
        const now = new Date();
        const currentHour = now.getHours();
        const absoluteIndex = 24 + currentHour;
        const currentUv = data.hourly.uv_index[absoluteIndex] || 0;
        
        const centeredData = data.hourly.uv_index.slice(absoluteIndex - 12, absoluteIndex + 13);
        
        setWeatherData({
          currentUv,
          hourlyUvData: centeredData,
          locationName: city,
        });
      }
    } catch (error) {
      console.error("Weather fetch error:", error);
      setErrorMsg("Failed to fetch data");
    } finally {
      setLoading(false);
      setTimeout(() => {
        const itemWidth = 40 + 12;
        const centerOffset = (itemWidth * 12) + (itemWidth / 2) - (screenWidth / 2) + 20;
        scrollRef.current?.scrollTo({ x: centerOffset, animated: true });
      }, 100);
    }
  };

  const uvInfo = getUvBand(cachedCurrentUv);
  const maxDailyUv = Math.max(...hourlyUvData, 1);
  const peakHourIndex = hourlyUvData.indexOf(Math.max(...hourlyUvData));

  return (
    <GradientBackground>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.screenTitle}>UV Index</Text>
          <Text style={styles.locationLabel}>
            {loading ? "Detecting location..." : locationName || "Location not found"}
          </Text>
        </View>

        {errorMsg && (
          <GlassCard style={styles.errorCard}>
            <Text style={styles.errorText}>{errorMsg}</Text>
          </GlassCard>
        )}

        {/* Current UV card - Centered & Glossy */}
        <GlassCard style={styles.uvCard}>
          <View style={styles.cardContent}>
            {loading ? (
              <ActivityIndicator color={COLORS.accentYellow} size="large" />
            ) : (
              <View style={styles.centeredMainView}>
                <View style={styles.timeBadge}>
                   <Clock size={12} color={COLORS.accentYellow} style={{ marginRight: 6 }} />
                   <Text style={styles.timeLabel}>
                     {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                   </Text>
                </View>
                
                <Text style={[styles.uvNumber, { color: uvInfo.color }]}>
                  {cachedCurrentUv.toFixed(0)}
                </Text>
                
                <View style={styles.categoryContainer}>
                   <Text style={styles.uvCategory}>{uvInfo.label}</Text>
                </View>

                <View style={styles.uvLevelBar}>
                  <View style={[styles.uvLevelProgress, { width: `${Math.min((cachedCurrentUv / 12) * 100, 100)}%`, backgroundColor: uvInfo.color }]} />
                </View>
              </View>
            )}
          </View>
        </GlassCard>

        {/* Timeline (Adaptive Scaling) */}
        {!loading && hourlyUvData.length > 0 && (
          <GlassCard style={styles.timelineCard}>
            <View style={styles.timelineHeader}>
              <View>
                <Text style={styles.sectionTitle}>Daily Forecast</Text>
                <Text style={styles.sectionSubtitle}>24h Exposure View</Text>
              </View>
              <View style={styles.peakBadge}>
                <Sparkles size={10} color={COLORS.accentYellow} style={{ marginRight: 4 }} />
                <Text style={styles.peakText}>PEAK {maxDailyUv.toFixed(1)}</Text>
              </View>
            </View>
            
            <View style={styles.timelineContainer}>
              <ScrollView 
                ref={scrollRef}
                horizontal 
                showsHorizontalScrollIndicator={false} 
                style={styles.timelineScroll}
                contentContainerStyle={styles.timelineContent}
              >
                {hourlyUvData.map((uv, index) => {
                  const isNow = index === 12;
                  const isPeak = uv === maxDailyUv && uv > 0;
                  const nowHour = new Date().getHours();
                  const itemHour = (nowHour - 12 + index + 24) % 24;
                  const info = getUvBand(uv);
                  
                  // Adaptive Height: If max is 6, 6 fills 100% of 90px
                  const barHeight = maxDailyUv > 0 ? (uv / maxDailyUv) * 90 : 2;

                  return (
                    <View key={index} style={[styles.timelineItem, isNow && styles.nowItem]}>
                      {isNow && <View style={styles.nowIndicatorBox} />}
                      <View style={styles.barContainer}>
                        <View 
                          style={[
                            styles.uvIndicator, 
                            { 
                              height: Math.max(barHeight, 4), 
                              backgroundColor: info.color,
                              opacity: isPeak || isNow ? 1 : 0.6
                            },
                            isNow && styles.nowIndicatorBar
                          ]} 
                        />
                      </View>
                      <Text style={[styles.timelineHour, isNow && styles.nowHourText]}>
                        {isNow ? "NOW" : (itemHour === 0 ? "12 AM" : itemHour > 12 ? `${itemHour - 12} PM` : `${itemHour} AM`)}
                      </Text>
                      {isNow ? (
                        <View style={styles.nowUvContainer}>
                          <Text style={styles.nowUvText}>{uv.toFixed(1)}</Text>
                        </View>
                      ) : (
                        <Text style={styles.timelineUv}>{uv.toFixed(0)}</Text>
                      )}
                    </View>
                  );
                })}
              </ScrollView>
            </View>
          </GlassCard>
        )}

        {/* STATS GRID - Glossy & Highlighted */}
        <View style={styles.statsGrid}>
          <GlassCard style={styles.statBox}>
            <View style={styles.statInner}>
               <View style={styles.statHeader}>
                  <Clock size={16} color={COLORS.accentYellow} strokeWidth={3} />
                  <Text style={styles.statLabel}>Sun Exposure</Text>
               </View>
               <Text style={styles.statValue}>45<Text style={styles.statUnit}>m</Text></Text>
               <View style={styles.progressThin}>
                  <View style={[styles.progressFill, { width: '45%', backgroundColor: COLORS.accentYellow }]} />
               </View>
            </View>
          </GlassCard>
          
          <GlassCard style={styles.statBox}>
            <View style={styles.statInner}>
               <View style={styles.statHeader}>
                  <Droplet size={16} color="#60A5FA" strokeWidth={3} />
                  <Text style={styles.statLabel}>Fluids Lost</Text>
               </View>
               <Text style={styles.statValue}>0.8<Text style={styles.statUnit}>L</Text></Text>
               <View style={styles.progressThin}>
                  <View style={[styles.progressFill, { width: '60%', backgroundColor: "#60A5FA" }]} />
               </View>
            </View>
          </GlassCard>
        </View>

        <View style={styles.statsGrid}>
          <GlassCard style={styles.statBox}>
            <View style={styles.statInner}>
               <View style={styles.statHeader}>
                  <Dna size={16} color="#F472B6" strokeWidth={3} />
                  <Text style={styles.statLabel}>Vitamin D</Text>
               </View>
               <Text style={styles.statValue}>12k <Text style={styles.statUnit}>IU</Text></Text>
               <View style={styles.progressThin}>
                  <View style={[styles.progressFill, { width: '80%', backgroundColor: "#F472B6" }]} />
               </View>
            </View>
          </GlassCard>
          
          <GlassCard style={styles.statBox}>
            <View style={styles.statInner}>
               <View style={styles.statHeader}>
                  <TrendingUp size={16} color="#34D399" strokeWidth={3} />
                  <Text style={styles.statLabel}>Progress</Text>
               </View>
               <Text style={styles.statValue}>+12<Text style={styles.statUnit}>%</Text></Text>
               <View style={styles.progressThin}>
                  <View style={[styles.progressFill, { width: '70%', backgroundColor: "#34D399" }]} />
               </View>
            </View>
          </GlassCard>
        </View>

        {/* Weekly Progression - Redesigned */}
        <GlassCard style={styles.progressionCard}>
          <View style={styles.timelineHeader}>
            <View>
              <Text style={styles.sectionTitle}>Weekly Exposure</Text>
              <Text style={styles.sectionSubtitle}>Last 7 days performance</Text>
            </View>
            <TrendingUp size={20} color="rgba(255,255,255,0.4)" />
          </View>
          
          <View style={styles.chartContainer}>
            <View style={styles.dummyChart}>
               {[0.4, 0.7, 0.5, 0.9, 0.3, 0.6, 0.8].map((val, i) => (
                 <View key={i} style={styles.chartCol}>
                    <View style={[styles.dummyBar, { height: val * 60, opacity: i === 3 ? 1 : 0.4 }]}>
                       {i === 3 && <View style={styles.barGlow} />}
                    </View>
                    <Text style={styles.chartLabelText}>{['M','T','W','T','F','S','S'][i]}</Text>
                 </View>
               ))}
            </View>
          </View>
        </GlassCard>

        {/* Collaboration / Tips Card - Glowing */}
        <GlassCard style={styles.collabCard}>
          <View style={styles.collabInner}>
            <View style={styles.tipIconBox}>
               <Sparkles size={20} color={COLORS.accentYellow} />
            </View>
            <View style={styles.collabText}>
              <Text style={styles.collabTitle}>SunTan Premium Tips</Text>
              <Text style={styles.collabDesc}>Keep your skin hydrated after 4 PM to maximize your bronze glow.</Text>
            </View>
          </View>
        </GlassCard>
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20 },
  header: {
    marginBottom: 24,
  },
  screenTitle: {
    fontSize: 32,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -1,
  },
  locationLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF", // Full white for location
    textTransform: "uppercase",
    letterSpacing: 2,
    marginTop: 4,
  },
  uvCard: { 
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  cardContent: {
    padding: 30,
    minHeight: 180,
    justifyContent: "center",
  },
  centeredMainView: {
    alignItems: "center",
  },
  timeBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 8,
  },
  timeLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.accentYellow,
    letterSpacing: 1,
  },
  uvNumber: {
    fontSize: 84,
    fontWeight: "900",
    lineHeight: 84,
    marginVertical: 4,
  },
  categoryContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  uvCategory: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 3,
    textTransform: "uppercase",
  },
  uvLevelBar: {
    width: 100,
    height: 3,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 2,
    overflow: "hidden",
  },
  uvLevelProgress: {
    height: "100%",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  sectionSubtitle: {
    fontSize: 10,
    color: "rgba(255,255,255,0.4)",
    fontWeight: "700",
    textTransform: "uppercase",
    marginTop: 2,
  },
  timelineCard: {
    padding: 24,
    marginBottom: 20,
  },
  timelineHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  peakBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,215,0,0.1)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,215,0,0.2)",
  },
  peakText: {
    color: COLORS.accentYellow,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
  },
  timelineContainer: {
    height: 140,
  },
  timelineScroll: {
    flex: 1,
  },
  timelineContent: {
    alignItems: "flex-end",
    paddingRight: 20,
  },
  timelineItem: {
    alignItems: "center",
    marginRight: 16,
    minWidth: 44,
  },
  nowItem: {
    marginRight: 20,
  },
  nowIndicatorBox: {
    position: "absolute",
    top: -10,
    bottom: -10,
    left: -4,
    right: -4,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    zIndex: -1,
  },
  barContainer: {
    height: 90,
    justifyContent: "flex-end",
    alignItems: "center",
    marginBottom: 12,
    width: "100%",
  },
  uvIndicator: {
    width: 20, // Increased width for better impact
    borderRadius: 6,
  },
  nowIndicatorBar: {
    width: 16, // Wider for current hour
    borderRadius: 8,
    shadowColor: "#FFFFFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  timelineHour: {
    fontSize: 10,
    fontWeight: "800",
    color: "rgba(255,255,255,0.3)",
    textTransform: "uppercase",
  },
  nowHourText: {
    color: COLORS.accentYellow,
    fontWeight: "900",
  },
  timelineUv: {
    fontSize: 12,
    fontWeight: "700",
    color: "rgba(255,255,255,0.5)",
    marginTop: 2,
  },
  nowUvContainer: {
    marginTop: 2,
  },
  nowUvText: {
    fontSize: 14,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  statBox: {
    flex: 0.48,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  statInner: {
    width: "100%",
  },
  statHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "rgba(255,255,255,0.4)",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginLeft: 8,
  },
  statValue: {
    fontSize: 26,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  statUnit: {
    fontSize: 14,
    color: "rgba(255,255,255,0.6)", // Brightened units
    fontWeight: "800",
    marginLeft: 2,
  },
  progressThin: {
    height: 3,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 2,
    marginTop: 12,
    width: "100%",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
  },
  progressionCard: {
    padding: 24,
    marginBottom: 20,
  },
  chartContainer: {
    marginTop: 20,
    height: 100,
    justifyContent: "flex-end",
  },
  dummyChart: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  chartCol: {
    alignItems: "center",
  },
  dummyBar: {
    width: 16,
    backgroundColor: COLORS.accentYellow,
    borderRadius: 8,
    position: "relative",
  },
  barGlow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.accentYellow,
    borderRadius: 8,
    opacity: 0.3,
    transform: [{ scaleX: 1.5 }, { scaleY: 1.1 }],
    zIndex: -1,
  },
  chartLabelText: {
    fontSize: 10,
    fontWeight: "900",
    color: "rgba(255,255,255,0.4)", // Brightened chart labels
    marginTop: 12,
  },
  collabCard: {
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255,215,0,0.15)",
    backgroundColor: "rgba(255,215,0,0.03)",
  },
  collabInner: {
    flexDirection: "row",
    alignItems: "center",
  },
  tipIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(255,215,0,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  collabText: {
    marginLeft: 16,
    flex: 1,
  },
  collabTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  collabDesc: {
    fontSize: 13,
    color: "rgba(255,255,255,0.4)",
    lineHeight: 18,
    marginTop: 2,
  },
  errorCard: {
    padding: 16,
    backgroundColor: "rgba(255,59,48,0.1)",
    borderColor: "rgba(255,59,48,0.3)",
    borderWidth: 1,
    marginBottom: 16,
  },
  errorText: {
    color: "#FF3B30",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
});
