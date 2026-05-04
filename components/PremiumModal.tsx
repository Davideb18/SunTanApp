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
  const { packages, purchasePackage, restorePurchases, presentCodeRedemptionSheet } = useRevenueCat();
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
  }, [visible]);

  // Resolve packages
  const annual    = packages.find(p => p.packageType === PACKAGE_TYPE.ANNUAL);
  const quarterly = packages.find(p => p.packageType === PACKAGE_TYPE.THREE_MONTH);
  const monthly   = packages.find(p => p.packageType === PACKAGE_TYPE.MONTHLY);

  const plans = [
    {
      key: "annual",
      pack: annual,
      label: "Annual Elite",
      period: t.language === "it" ? "/ anno" : "/ year",
      badge: "CONVIENE",
      saving: t.language === "it" ? "RISPARMIA 58%" : "SAVE 58%",
      fallbackPrice: "€24.99",
      trial: "7 GIORNI GRATIS",
    },
    {
      key: "quarterly",
      pack: quarterly,
      label: "3 Months Pro",
      period: t.language === "it" ? "/ 3 mesi" : "/ 3 months",
      badge: "POPULAR",
      saving: null,
      fallbackPrice: "€12.99",
      trial: "3 GIORNI GRATIS",
    },
    {
      key: "monthly",
      pack: monthly,
      label: "Monthly Pass",
      period: t.language === "it" ? "/ mese" : "/ month",
      badge: null,
      saving: null,
      fallbackPrice: "€4.99",
      trial: null,
    },
  ];

  const handlePurchase = async () => {
    const selectedPlan = plans[selectedIndex];
    if (!selectedPlan.pack) {
      Alert.alert(
        t.language === "it" ? "Modalità Demo" : "Demo Mode",
        t.language === "it"
          ? "In Expo Go gli acquisti non sono attivi. Questa è una demo del design."
          : "In Expo Go purchases are not active. This is a design demo."
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
        t.language === "it" ? "Nessun acquisto" : "No purchases",
        t.language === "it" ? "Nessun abbonamento trovato." : "No active subscription found."
      );
    }
  };

  const FEATURES = [
    {
      id: "coach",
      title: "AI Smart Coach",
      icon: <Zap />,
      content: (
        <View className="rounded-2xl bg-black/40 p-4 border border-white/10">
          <Text className="text-[11px] font-bold text-white/70 leading-5 mb-4">{t.feat1}</Text>
          <View className="flex-row gap-3">
             <View className="flex-1 bg-white/10 rounded-2xl p-3 items-center">
                <View className="h-7 w-7 rounded-full bg-[#C68642] mb-1.5" />
                <Text className="text-[9px] font-black text-white/50">TYPE 4</Text>
             </View>
             <View className="flex-[2] bg-white/15 rounded-2xl p-3 justify-center">
                <View className="flex-row gap-1 mb-2">
                   <View className="h-2 flex-1 bg-white rounded-full" />
                   <View className="h-2 flex-1 bg-white/20 rounded-full" />
                </View>
                <Text className="text-[10px] font-black text-white italic">3 x 8 min {t.rotations}</Text>
             </View>
          </View>
        </View>
      )
    },
    {
      id: "forecast",
      title: t.language === 'it' ? "Previsioni & Strategia" : "Strategy & Forecast",
      icon: <Sun />,
      content: (
        <View className="rounded-2xl bg-black/40 p-4 border border-white/10">
          <Text className="text-[11px] font-bold text-white/70 leading-5 mb-4">{t.feat2}</Text>
          <View className="flex-row items-end gap-1.5 h-12 justify-center">
             {[2,5,8,9,7,4].map((h, i) => (
               <View key={i} className="w-4 rounded-t-md" style={{ height: `${h*10}%`, backgroundColor: h > 7 ? 'white' : 'rgba(255,255,255,0.3)' }} />
             ))}
          </View>
        </View>
      )
    },
    {
      id: "skin",
      title: "Skin Intelligence",
      icon: <ShieldCheck />,
      content: (
        <View className="rounded-2xl bg-black/40 p-4 border border-white/10">
          <Text className="text-[11px] font-bold text-white/70 leading-5 mb-4">{t.feat3}</Text>
          <View className="flex-row items-center justify-between">
             <View className="flex-row items-center">
                <View className="h-9 w-9 rounded-full bg-[#D2B48C]" />
                <ChevronRight size={14} color="white" opacity={0.3} style={{marginHorizontal: 10}} />
                <View className="h-9 w-9 rounded-full bg-[#8B4513] border-2 border-white" />
             </View>
             <View className="items-end">
                <Text className="text-[11px] font-black text-white italic">HEALTHY: 98%</Text>
                <Text className="text-[9px] font-bold text-white/40 uppercase">RECOVERY OK</Text>
             </View>
          </View>
        </View>
      )
    },
    {
      id: "history",
      title: t.language === 'it' ? "Cronologia Infinita" : "Infinite History",
      icon: <Clock />,
      content: (
        <View className="rounded-2xl bg-black/40 p-5 items-center border border-white/10">
           <Sparkles size={24} color="white" />
           <Text className="text-white font-black text-2xl mt-2 tracking-[-1px]">∞ SESSIONS</Text>
           <Text className="text-[10px] font-bold text-white/30 uppercase mt-1">UNLIMITED CLOUD SYNC</Text>
        </View>
      )
    }
  ];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "#000" }}>
        <LinearGradient
          colors={["#FF4D00", "#FF8C00", "#000000"]}
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
            <View className="flex-row justify-between items-start mb-8">
              <View>
                <Text className="text-5xl font-black text-white italic tracking-[-2px]">Glowy Pro</Text>
                <Text className="text-[11px] font-black text-white/70 uppercase tracking-[4px] mt-1.5">
                  {t.premiumSubtitle}
                </Text>
              </View>
              <Animated.View style={{ opacity: closeFadeAnim }}>
                <Pressable 
                  onPress={() => {
                    if (canClose) onClose();
                  }}
                  className="h-12 w-12 items-center justify-center rounded-full bg-white/20 border-[3px] border-white"
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
              contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
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
                        marginBottom: 12,
                        borderRadius: 28,
                        borderWidth: 3,
                        overflow: 'hidden',
                        borderColor: isSelected ? 'white' : 'rgba(255,255,255,0.1)',
                        backgroundColor: isSelected ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.05)',
                      }}
                    >
                      <View className="p-4 flex-row items-center justify-between">
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
                          <Text className="text-2xl font-black text-white leading-7">{plan.pack?.product.priceString ?? plan.fallbackPrice}</Text>
                          {plan.saving && <Text className="text-[10px] font-black text-white uppercase tracking-[1px] opacity-80">{plan.saving}</Text>}
                        </View>
                      </View>
                    </Pressable>
                  );
                })}
              </View>

              {/* CTA - Larger and Brighter */}
              <Pressable
                onPress={handlePurchase}
                disabled={loading}
                style={({ pressed }) => ({
                  height: 80,
                  backgroundColor: 'white',
                  borderRadius: 32,
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: '#fff',
                  shadowOffset: { width: 0, height: 10 },
                  shadowOpacity: 0.3,
                  shadowRadius: 20,
                  elevation: 10,
                  marginBottom: 32,
                  opacity: pressed ? 0.8 : 1
                })}
              >
                {loading ? <ActivityIndicator color="black" /> : (
                  <View className="flex-row items-center">
                    <Zap size={24} color="black" fill="black" className="mr-3" />
                    <Text className="text-xl font-black text-black uppercase tracking-[1.5px]">{t.language === 'it' ? "PROVA GRATIS ORA" : "START FREE TRIAL"}</Text>
                  </View>
                )}
              </Pressable>

              {/* Footer */}
              <View className="flex-row justify-center gap-x-12 mb-6">
                <Pressable 
                  onPress={handleRestore}
                  style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
                >
                  <Text className="text-[12px] font-black text-white/50 uppercase tracking-[2px]">{t.language === 'it' ? "RIPRISTINA" : "RESTORE"}</Text>
                </Pressable>
                {Platform.OS === "ios" && (
                  <Pressable 
                    onPress={presentCodeRedemptionSheet}
                    style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
                  >
                    <Text className="text-[12px] font-black text-white/50 uppercase tracking-[2px]">{t.language === 'it' ? "USA CODICE" : "USE CODE"}</Text>
                  </Pressable>
                )}
              </View>

              <Text className="text-[10px] text-white/30 font-bold text-center leading-4 px-10 pb-6">
                {t.premiumDisclaimer}
              </Text>

            </ScrollView>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
