import React from "react";
import { View, Text, Modal, TouchableOpacity, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X, Shield, FileText, CheckCircle2 } from "lucide-react-native";
import { GradientBackground } from "./GradientBackground";
import { GlassCard } from "./GlassCard";
import { LEGAL_TEXT } from "@/constants/legal_text";

interface LegalModalProps {
  visible: boolean;
  onClose: () => void;
  type?: "privacy" | "terms";
}

export const LegalModal: React.FC<LegalModalProps> = ({ visible, onClose, type = "privacy" }) => {
  const insets = useSafeAreaInsets();

  const content = {
    privacy: {
      title: "Privacy Policy",
      icon: <Shield size={24} color="#60A5FA" />,
      text: LEGAL_TEXT
    },
    terms: {
      title: "Terms of Service",
      icon: <FileText size={24} color="#FB923C" />,
      text: LEGAL_TEXT
    }
  };

  const cleanText = (text: string) => {
    return text
      .replace(/#/g, "")      // Rimuove gli header
      .replace(/\*/g, "")     // Rimuove i grassetti/corsivi
      .trim();
  };

  const active = content[type];

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View className="flex-1 bg-black">
        <GradientBackground>
          <View className="flex-1" style={{ paddingTop: insets.top }}>
            <View className="flex-row items-center justify-between px-6 py-4">
              <View className="flex-row items-center">
                {active.icon}
                <Text className="ml-3 text-2xl font-black text-white">{active.title}</Text>
              </View>
              <TouchableOpacity 
                onPress={onClose}
                className="h-10 w-10 items-center justify-center rounded-full bg-white/10"
              >
                <X size={20} color="white" />
              </TouchableOpacity>
            </View>

            <ScrollView 
              className="flex-1 px-6"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
            >
              <GlassCard style={{ 
                padding: 24, 
                borderRadius: 32, 
                backgroundColor: "rgba(0,0,0,0.6)", 
                borderWidth: 2, 
                borderColor: "rgba(255,255,255,0.8)", 
                marginTop: 10 
              }}>
                <Text className="text-base leading-[26px] text-white/80 font-medium">
                  {cleanText(active.text)}
                </Text>
                
                <View className="mt-12 items-center">
                  <CheckCircle2 size={32} color="#4ADE80" opacity={0.6} />
                  <Text className="mt-4 text-[10px] font-black text-white/30 uppercase tracking-[2px]">Last Updated: April 25, 2026</Text>
                </View>
              </GlassCard>

              <TouchableOpacity 
                onPress={onClose}
                className="mt-8 bg-white py-5 rounded-[24px] items-center shadow-lg"
                activeOpacity={0.9}
              >
                <Text className="text-sm font-black uppercase tracking-[2px] text-black">Close & Accept</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </GradientBackground>
      </View>
    </Modal>
  );
};
