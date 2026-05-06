/**
 * PremiumModal.tsx
 *
 * Ultra-high contrast paywall with white accents and large, readable elements.
 * Features use white-box icons and solid white borders for maximum visibility.
 */

import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
  Alert,
  Animated,
  Platform,
  Pressable,
  Image,
  Dimensions,
} from "react-native";
import { X, Check, Zap, ShieldCheck, Clock, Sun, ChevronRight, ChevronDown, Calendar, AlertTriangle, Sparkles } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS } from "@/constants/theme";
import { useTranslation } from "@/constants/i18n";
import { useRevenueCat } from "@/hooks/useRevenueCat";
import { useAppStore } from "@/store/useAppStore";
import { PACKAGE_TYPE } from "react-native-purchases";

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface PremiumModalProps {
  visible: boolean;
  onClose: () => void;
}

const FeatureItem = ({ title, icon, children, isExpanded, onToggle }: any) => {
  return (
    <View className={`mb-3 overflow-hidden rounded-[28px] border-2 ${isExpanded ? 'border-white bg-white/15' : 'border-white/20 bg-white/5'}`}>
      <Pressable 
        onPress={onToggle}
        className="flex-row items-center p-5 justify-between"
        style={({ pressed }) => ({
          opacity: pressed ? 0.8 : 1
        })}
      >
        <View className="flex-row items-center flex-1">
          <View className="h-11 w-11 bg-white rounded-2xl items-center justify-center mr-4 shadow-xl">
            {React.cloneElement(icon as React.ReactElement<{ size?: number; color?: string; fill?: string }>, { 
              size: 20, 
              color: 'black',
              fill: (icon as React.ReactElement<{ fill?: string }>).props.fill ? 'black' : 'none'
            })}
          </View>
          <Text className={`text-lg font-black italic ${isExpanded ? 'text-white' : 'text-white/90'}`}>{title}</Text>
        </View>
        <View className="ml-2">
          {isExpanded ? <ChevronDown size={20} color="white" /> : <ChevronRight size={20} color="white" opacity={0.5} />}
        </View>
      </Pressable>
      
      {isExpanded && (
        <View className="px-5 pb-5">
           <View className="h-[1px] bg-white/20 mb-4" />
           {children}
        </View>
      )}
    </View>
  );
};

export function PremiumModal({ visible, onClose }: PremiumModalProps) {
  const t = useTranslation();
  const language = useAppStore((s) => s.language);
  const isItalian = language === "it";
  const { packages, isLoadingOfferings, refreshOfferings, purchasePackage, restorePurchases, presentCodeRedemptionSheet } = useRevenueCat();
  const [loading, setLoading] = React.useState(false);
  const [selectedIndex, setSelectedIndex] = React.useState(1);
  const [expandedFeature, setExpandedFeature] = useState<string | null>(null);
  const [canClose, setCanClose] = useState(false);
  const closeFadeAnim = useRef(new Animated.Value(0)).current;

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(100)).current;

  useEffect(() => {
    if (visible) {
      // Retry fetching offerings each time paywall opens to avoid stale "Loading..." prices.
      refreshOfferings();
      setCanClose(false);
      closeFadeAnim.setValue(0);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 10, useNativeDriver: true }),
      ]).start();
      // X appears after 2 seconds
      const closeTimer = setTimeout(() => {
        setCanClose(true);
        Animated.timing(closeFadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
      }, 2000);
      return () => clearTimeout(closeTimer);
    } else {
      fadeAnim.setValue(0);
      slideAnim.setValue(100);
      closeFadeAnim.setValue(0); // Reset X opacity
      setExpandedFeature(null);
      setCanClose(false);
    }
  }, [visible, refreshOfferings]);

  // Resolve packages from RevenueCat offering.
  // We try packageType first, then fallback by identifier matching to avoid silent mismatches.
  const findPackage = (packageType: PACKAGE_TYPE, idHints: string[]) => {
    const byType = packages.find((p) => p.packageType === packageType);
    if (byType) return byType;

    return packages.find((p) => {
      const identifier = `${p.identifier ?? ""} ${p.product.identifier ?? ""}`.toLowerCase();
      return idHints.some((hint) => identifier.includes(hint));
    });
  };

  const annual = findPackage(PACKAGE_TYPE.ANNUAL, ["annual", "year", "yearly"]);
  const quarterly = findPackage(PACKAGE_TYPE.THREE_MONTH, ["quarter", "3month", "three_month", "three-month"]);
  const monthly = findPackage(PACKAGE_TYPE.MONTHLY, ["monthly", "month"]);

  const plans = [
    {
      key: "annual",
      pack: annual,
      label: t.annualElite,
      period: isItalian ? "/ anno" : "/ year",
      badge: isItalian ? "RISPARMIA 58%" : "SAVE 58%", // We can use badge for something else or just leave it
      saving: isItalian ? "RISPARMIA 58%" : "SAVE 58%",
      trial: t.sevenDayTrial,
      originalPrice: monthly?.product ? 
        monthly.product.priceString.replace(/[\d.,]+/, (monthly.product.price * 12).toFixed(2)) 
        : (isItalian ? "59,99 €" : "$59.99"),
    },
    {
      key: "quarterly",
      pack: quarterly,
      label: t.quarterlyPro,
      period: isItalian ? "/ 3 mesi" : "/ 3 months",
      badge: isItalian ? "PIÙ ACQUISTATO" : "MOST POPULAR",
      saving: null,
      trial: null,
    },
    {
      key: "monthly",
      pack: monthly,
      label: t.monthlyPass,
      period: isItalian ? "/ mese" : "/ month",
      badge: null,
      saving: null,
      trial: null,
    },
  ];

  const handlePurchase = async () => {
    const selectedPlan = plans[selectedIndex];
    if (!selectedPlan.pack) {
      Alert.alert(
        isItalian ? "Offerta non disponibile" : "Offer not available",
        isItalian
          ? "Prezzi e pacchetti non sono ancora stati caricati da RevenueCat. Verifica API key, offering e connessione, poi riapri il paywall."
          : "Packages and prices are not loaded from RevenueCat yet. Check API key, offering, and connectivity, then reopen the paywall."
      );
      return;
    }
    setLoading(true);
    const success = await purchasePackage(selectedPlan.pack);
    setLoading(false);
    if (success) onClose();
  };

  const handleRestore = async () => {
    setLoading(true);
    const success = await restorePurchases();
    setLoading(false);
    if (success) {
      onClose();
    } else {
      Alert.alert(
        isItalian ? "Nessun acquisto" : "No purchases",
        isItalian ? "Nessun abbonamento trovato." : "No active subscription found."
      );
    }
  };

  const FEATURES = [
    {
      id: "coach",
      title: isItalian ? "AI Smart Coach" : "AI Smart Coach",
      icon: <Zap />,
      content: (
        <View className="rounded-2xl bg-black/40 p-4 border border-white/10">
          <Text className="text-[13px] font-bold text-white/70 leading-5 mb-4">{t.feat1}</Text>
          {/* Personalized Plan Preview */}
          <View className="rounded-lg bg-gradient-to-r from-accentYellow/20 to-orange-500/20 border border-accentYellow/40 p-4 mb-3">
             <Text className="text-[12px] font-black text-accentYellow uppercase tracking-widest mb-2">{t.coachPlanLabel}</Text>
             <Text className="text-[15px] font-black text-white leading-tight mb-2">
                📋 {t.coachPlanDesc.replace("Tipo 4", "").trim()}
                <Text className="text-accentYellow"> Tipo 4</Text>
             </Text>
             <Text className="text-[12px] font-bold text-white/50 italic">
                {t.coachWeeklyDesc}
             </Text>
          </View>
          <View className="bg-white/5 rounded-lg p-3 border-l-2 border-sky-400">
             <Text className="text-[13px] font-bold text-white">✓ {t.coachAdapted}</Text>
             <Text className="text-[13px] font-bold text-white/50 mt-1">{t.coachNoGeneric}</Text>
          </View>
        </View>
      )
    },
    {
      id: "forecast",
      title: isItalian ? "Previsioni & Strategia" : "Strategy & Forecast",
      icon: <Sun />,
      content: (
        <View className="rounded-2xl bg-black/40 p-4 border border-white/10">
          <Text className="text-[13px] font-bold text-white/70 leading-5 mb-4">{t.feat2}</Text>
          {/* Tomorrow Forecast Box Mock */}
          <View className="rounded-card bg-gradient-to-br from-accentYellow/15 to-orange-500/10 border-2 border-accentYellow p-4 mb-3">
             <Text className="text-[12px] font-black text-accentYellow/70 uppercase tracking-widest mb-3">☀️ {t.forecastTomorrow}</Text>
             {/* Time Range — BIG */}
             <Text className="text-[32px] font-black text-accentYellow leading-none mb-2">15:00-17:00</Text>
             <Text className="text-[13px] font-bold text-white/60 mb-3">{t.forecastWindow}</Text>
             {/* UV + Temp Row */}
             <View className="flex-row gap-3 mb-3">
                <View className="flex-1 bg-white/10 rounded-lg p-2 border border-white/20">
                   <Text className="text-[10px] font-black text-white/50 mb-1">{t.forecastUvIndex}</Text>
                   <Text className="text-[20px] font-black text-accentYellow">8.5</Text>
                </View>
                <View className="flex-1 bg-white/10 rounded-lg p-2 border border-white/20">
                   <Text className="text-[10px] font-black text-white/50 mb-1">{t.forecastTemp}</Text>
                   <Text className="text-[20px] font-black text-white">28°C</Text>
                </View>
             </View>
             {/* Recommendation */}
             <View className="bg-emerald-500/20 border border-emerald-500/50 rounded-lg p-2">
                <Text className="text-[13px] font-black text-emerald-300">✅ {t.forecastRecommended}</Text>
             </View>
          </View>
          {/* Chart Context */}
          <View className="bg-white/5 rounded-lg p-3 border-l-2 border-sky-400">
             <Text className="text-[13px] font-bold text-white">{t.forecastChart}</Text>
             <Text className="text-[12px] font-bold text-white/50 mt-1">{t.forecastPlan}</Text>
          </View>
        </View>
      )
    },
    {
      id: "skin",
      title: isItalian ? "Protezione Pelle " : "Skin Protection",
      icon: <ShieldCheck />,
      content: (
        <View className="rounded-2xl bg-black/40 p-4 border border-white/10">
          <Text className="text-[12px] font-bold text-white/70 leading-5 mb-4">{t.feat3}</Text>
          {/* Skin Progress */}
          <View className="rounded-lg bg-white/5 p-3 mb-3">
             <View className="flex-row items-center justify-between mb-2">
                <Text className="text-[11px] font-black text-white/50">{isItalian ? "STATO PELLE" : "SKIN STATUS"}</Text>
                <Text className="text-[12px] font-black text-emerald-400">{isItalian ? "98% SALUTE" : "98% HEALTH"}</Text>
             </View>
             <View className="h-2 bg-white/10 rounded-full overflow-hidden">
                <View className="h-full bg-emerald-500 rounded-full" style={{width: '98%'}} />
             </View>
          </View>
          {/* Recovery Info */}
          <View className="flex-row items-center justify-between bg-white/5 rounded-lg p-2 border-l-2 border-sky-400">
             <Text className="text-[12px] font-bold text-sky-400">{isItalian ? "Recovery Score" : "Recovery Score"}</Text>
             <Text className="text-[14px] font-black text-white">↗ +12%</Text>
          </View>
        </View>
      )
    },
    {
      id: "history",
      title: isItalian ? "Cronologia Infinita" : "Infinite History",
      icon: <Clock />,
      content: (
        <View className="rounded-2xl bg-black/40 p-4 border border-white/10">
          <Text className="text-[12px] font-bold text-white/70 leading-5 mb-4">{t.feat4}</Text>
          {/* Skin Progression Over Time */}
          <View className="rounded-lg bg-white/5 p-4 mb-3 border border-white/10">
             <Text className="text-[11px] font-black text-white/50 mb-3 uppercase tracking-widest">{isItalian ? "Progressione Pelle" : "Skin Progression"}</Text>
             {/* Timeline with Health Scores */}
             <View className="gap-2">
                <View className="flex-row items-center justify-between">
                   <Text className="text-[11px] font-black text-white/50">{isItalian ? "Settimana 1" : "Week 1"}</Text>
                   <View className="flex-row items-center gap-2 flex-1 ml-3">
                      <View className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                         <View className="h-full bg-orange-400 rounded-full" style={{width: '45%'}} />
                      </View>
                      <Text className="text-[11px] font-black text-orange-400">45%</Text>
                   </View>
                </View>
                <View className="flex-row items-center justify-between">
                   <Text className="text-[11px] font-black text-white/50">{isItalian ? "Settimana 3" : "Week 3"}</Text>
                   <View className="flex-row items-center gap-2 flex-1 ml-3">
                      <View className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                         <View className="h-full bg-yellow-400 rounded-full" style={{width: '70%'}} />
                      </View>
                      <Text className="text-[11px] font-black text-yellow-400">70%</Text>
                   </View>
                </View>
                <View className="flex-row items-center justify-between">
                   <Text className="text-[11px] font-black text-white/50">{isItalian ? "Settimana 6" : "Week 6"}</Text>
                   <View className="flex-row items-center gap-2 flex-1 ml-3">
                      <View className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                         <View className="h-full bg-emerald-400 rounded-full" style={{width: '90%'}} />
                      </View>
                      <Text className="text-[11px] font-black text-emerald-400">90%</Text>
                   </View>
                </View>
                <View className="flex-row items-center justify-between">
                   <Text className="text-[11px] font-black text-white/50">{isItalian ? "Oggi" : "Today"}</Text>
                   <View className="flex-row items-center gap-2 flex-1 ml-3">
                      <View className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                         <View className="h-full bg-emerald-500 rounded-full" style={{width: '98%'}} />
                      </View>
                      <Text className="text-[11px] font-black text-emerald-500">98%</Text>
                   </View>
                </View>
             </View>
          </View>
          {/* Key Value Proposition */}
          <View className="bg-white/5 rounded-lg p-3 border-l-2 border-accentYellow">
             <Text className="text-[13px] font-bold text-white">📈 {t.historyProgression}</Text>
             <Text className="text-[12px] font-bold text-white/50 mt-1">{t.historyNotTime}</Text>
          </View>
        </View>
      )
    }
  ];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "#000" }}>
        <LinearGradient
          colors={["#FFD700", "#FF4500", "#000000"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        />
        <Image 
          source={require("@/assets/images/logo.png")} 
          style={{ 
            position: "absolute", 
            top: -20, 
            right: -60, 
            width: 350, 
            height: 350, 
            opacity: 0.15, 
            transform: [{ rotate: "15deg" }] 
          }} 
          resizeMode="contain"
        />

        <Animated.View style={{ flex: 1, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <View className="flex-1 px-6" style={{ paddingTop: Platform.OS === 'ios' ? 70 : 50, paddingBottom: 30 }}>
            
            {/* Header - More Spacious */}
            <View className="flex-row justify-between items-start mb-8 gap-4">
              <View className="flex-1 shrink">
                <Text className="text-5xl font-black text-white italic tracking-[-2px]" numberOfLines={1} adjustsFontSizeToFit>Glowy Pro</Text>
                <Text className="text-[11px] font-black text-white/70 uppercase tracking-[4px] mt-1.5 flex-wrap">
                  {t.premiumSubtitle}
                </Text>
              </View>
              <Animated.View style={{ opacity: closeFadeAnim }}>
                <Pressable 
                  onPress={() => {
                    if (canClose) onClose();
                  }}
                  className="h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-full bg-white/20 border-[3px] border-white ml-2"
                  style={({ pressed }) => ({
                    opacity: canClose && pressed ? 0.7 : 1
                  })}
                >
                  <X size={24} color="white" />
                </Pressable>
              </Animated.View>
            </View>

            <ScrollView 
              showsVerticalScrollIndicator={false} 
              contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
              scrollEnabled={true}
            >
              
              {/* Features - Larger with White Boxes */}
              <View className="mb-8">
                {FEATURES.map((feat) => (
                  <FeatureItem
                    key={feat.id}
                    title={feat.title}
                    icon={feat.icon}
                    isExpanded={expandedFeature === feat.id}
                    onToggle={() => setExpandedFeature(expandedFeature === feat.id ? null : feat.id)}
                  >
                    {feat.content}
                  </FeatureItem>
                ))}
              </View>

              {/* Plans - High Contrast White Border Selection */}
              <View className="mb-8">
                {plans.map((plan, index) => {
                  const isSelected = selectedIndex === index;
                  return (
                    <Pressable
                      key={plan.key}
                      onPress={() => setSelectedIndex(index)}
                      style={{
                        position: 'relative',
                        marginBottom: 12,
                        borderRadius: 28,
                        borderWidth: 3,
                        overflow: 'hidden',
                        borderColor: isSelected ? 'white' : 'rgba(255,255,255,0.1)',
                        backgroundColor: isSelected ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.05)',
                      }}
                    >
                      {/* Top Right Badge (for Most Popular) */}
                      {plan.badge && plan.key === "quarterly" && (
                        <View className="absolute top-0 right-0 bg-white px-3 py-1 rounded-bl-xl">
                          <Text className="text-[10px] font-black text-black uppercase tracking-[1px]">{plan.badge}</Text>
                        </View>
                      )}

                      <View className={`p-4 ${plan.badge && plan.key === "quarterly" ? 'pt-6' : ''} flex-row items-center justify-between`}>
                        <View className="flex-row items-center flex-1">
                          <View className={`h-6 w-6 rounded-full border-2 items-center justify-center mr-4 ${isSelected ? 'border-white bg-white' : 'border-white/30'}`}>
                            {isSelected && <View className="h-2.5 w-2.5 rounded-full bg-black" />}
                          </View>
                          <View>
                            <Text className="text-lg font-black text-white italic">{plan.label}</Text>
                            {plan.trial && <Text className="text-[10px] font-black text-white uppercase mt-0.5 tracking-[1px]">{plan.trial}</Text>}
                          </View>
                        </View>
                        <View className="items-end">
                          <View className="flex-row items-end">
                            {plan.originalPrice && (
                              <Text className="text-sm font-bold text-white/50 line-through mr-2 pb-0.5">
                                {plan.originalPrice}
                              </Text>
                            )}
                            <Text className="text-2xl font-black text-white leading-7">
                              {plan.pack?.product.priceString ?? (isItalian ? 'Caricamento...' : 'Loading...')}
                            </Text>
                          </View>
                          {plan.saving && (
                            <View className="mt-1 bg-white px-2 py-0.5 rounded shadow-sm">
                              <Text className="text-[10px] font-black text-black uppercase tracking-[1px]">{plan.saving}</Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </Pressable>
                  );
                })}
              </View>

              {/* CTA Button */}
              <TouchableOpacity
                onPress={handlePurchase}
                disabled={loading}
                activeOpacity={0.8}
                className="w-full h-20 rounded-[28px] items-center justify-center mb-6 border border-white"
                style={{
                  backgroundColor: '#FFFFFF',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.3,
                  shadowRadius: 16,
                  elevation: 10,
                  opacity: plans[selectedIndex]?.pack ? 1 : 0.7,
                }}
              >
                {loading ? <ActivityIndicator color="black" /> : (
                  <Text className="text-xl font-black text-black uppercase tracking-[1.5px]">
                    {plans[selectedIndex]?.trial
                      ? (isItalian ? "PROVA GRATIS ORA" : "START FREE TRIAL")
                      : (isItalian ? "SBLOCCA PREMIUM" : "GET PREMIUM")
                    }
                  </Text>
                )}
              </TouchableOpacity>

              {!plans.some((p) => !!p.pack) && (
                <View className="items-center mb-4 px-8">
                  {isLoadingOfferings ? (
                    <View className="items-center">
                      <ActivityIndicator color="white" />
                      <Text className="text-[11px] text-white/70 font-bold text-center mt-2">{isItalian ? "Caricamento prezzi in corso..." : "Loading prices..."}</Text>
                      <TouchableOpacity onPress={refreshOfferings} className="mt-3 px-4 py-2 rounded-full border border-white">
                        <Text className="text-[12px] font-bold text-white">{isItalian ? "Riprova ora" : "Retry now"}</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View className="items-center">
                      <Text className="text-[11px] text-white/70 font-bold text-center mb-2">{isItalian ? "Prezzi non disponibili. Controlla RevenueCat API key e offering corrente." : "Prices unavailable. Check RevenueCat API key and current offering."}</Text>
                      <TouchableOpacity onPress={refreshOfferings} className="mt-2 px-4 py-2 rounded-full border border-white">
                        <Text className="text-[12px] font-bold text-white">{isItalian ? "Riprova" : "Retry"}</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}

              {/* Footer - removed Restore button (confusing for most users) */}

              <Text className="text-[10px] text-white/30 font-bold text-center leading-4 px-10">
                {t.premiumDisclaimer}
              </Text>

            </ScrollView>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
