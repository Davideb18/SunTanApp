import React from "react";
import { View, Text, TouchableOpacity, Modal, ScrollView, TextInput } from "react-native";
import { X, Check, ShieldCheck, Zap, Sparkles, Star } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS } from "@/constants/theme";
import { GlassCard } from "./GlassCard";

interface PremiumModalProps {
  visible: boolean;
  onClose: () => void;
}

export function PremiumModal({ visible, onClose }: PremiumModalProps) {
  const features = [
    "AI-Powered Smart Coach",
    "Precise UV Hourly Tracking",
    "Exclusive Skin Tone Analysis",
    "Infinite Session History",
    "No Ads, High-Speed Forecasts",
    "Custom Safe Window Alerts"
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View className="flex-1 bg-black/95">
        <LinearGradient
          colors={['#1a1a1a', '#000']}
          className="flex-1 px-6"
        >
          <View className="flex-row justify-end pt-14 mb-8">
            <TouchableOpacity onPress={onClose} className="h-10 w-10 bg-white/10 rounded-full items-center justify-center">
              <X size={20} color="white" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View className="items-center mb-10">
              <View className="h-20 w-20 bg-accentYellow rounded-[24px] items-center justify-center mb-6 shadow-lg shadow-accentYellow/20">
                <ShieldCheck size={40} color="black" />
              </View>
              <Text className="text-4xl font-black text-white text-center tracking-[-1px]">Glowy Premium</Text>
              <Text className="text-accentYellow font-black text-sm uppercase tracking-[3px] mt-2">Unlock Your Best Tan</Text>
            </View>

            <View className="mb-10">
              {features.map((feature, i) => (
                <View key={i} className="flex-row items-center mb-4 bg-white/5 p-4 rounded-2xl border border-white/5">
                  <View className="h-6 w-6 bg-accentYellow/20 rounded-full items-center justify-center">
                    <Check size={14} color={COLORS.accentYellow} strokeWidth={4} />
                  </View>
                  <Text className="ml-4 text-white font-bold text-base">{feature}</Text>
                </View>
              ))}
            </View>

            <View className="mb-10">
              <Text className="text-[10px] font-black text-white/40 uppercase tracking-[2px] mb-3 ml-2">Do you have a partner code?</Text>
              <View className="flex-row gap-3">
                <TextInput
                  placeholder="Enter code (e.g. GLOWY-20)"
                  placeholderTextColor="rgba(255,255,255,0.2)"
                  className="flex-1 h-14 bg-white/5 border border-white/10 rounded-2xl px-5 text-white font-black"
                  autoCapitalize="characters"
                />
                <TouchableOpacity className="h-14 px-6 bg-white/10 border border-white/20 rounded-2xl items-center justify-center">
                  <Text className="text-white font-black text-xs uppercase">APPLY</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View className="gap-y-4 mb-10">
              <TouchableOpacity className="relative overflow-hidden bg-white p-6 rounded-[32px] items-center">
                 <View className="absolute top-0 right-0 bg-accentOrange px-4 py-1 rounded-bl-2xl">
                    <Text className="text-[10px] font-black text-white">POPULAR</Text>
                 </View>
                 <Text className="text-black font-black text-xl uppercase">Annual Elite</Text>
                 <View className="flex-row items-center mt-1">
                    <Text className="text-black font-black text-lg">€40</Text>
                    <Text className="ml-2 text-black/30 font-bold text-xs line-through">€100</Text>
                 </View>
              </TouchableOpacity>

              <TouchableOpacity className="bg-white/10 p-6 rounded-[32px] items-center border border-white/20">
                 <Text className="text-white font-black text-xl uppercase">Quarterly Pro</Text>
                 <View className="flex-row items-center mt-1">
                    <Text className="text-white font-black text-lg">€20</Text>
                    <Text className="ml-2 text-white/30 font-bold text-xs line-through">€30</Text>
                 </View>
              </TouchableOpacity>

              <TouchableOpacity className="bg-white/10 p-6 rounded-[32px] items-center border border-white/20">
                 <Text className="text-white font-black text-xl uppercase">Weekly Pass</Text>
                 <View className="flex-row items-center mt-1">
                    <Text className="text-white font-black text-lg">€7</Text>
                    <Text className="ml-2 text-white/30 font-bold text-xs line-through">€10</Text>
                 </View>
              </TouchableOpacity>
            </View>

            <Text className="text-center text-[10px] text-white/30 font-bold uppercase tracking-[1px] mb-20 px-8">
              Payment will be charged to your iTunes Account. Subscription automatically renews unless auto-renew is turned off.
            </Text>
          </ScrollView>
        </LinearGradient>
      </View>
    </Modal>
  );
}
