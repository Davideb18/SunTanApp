import React from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { useTranslation } from "@/constants/i18n";
import { COLORS } from "@/constants/theme";

interface AmbassadorCardProps {
  onPress: () => void;
}

export const AmbassadorCard = ({ onPress }: AmbassadorCardProps) => {
  const t = useTranslation();

  return (
    <View className="mt-8 mb-10 overflow-hidden rounded-[44px] border-[4px] border-white shadow-2xl">
      <LinearGradient
        colors={["#A855F7", "#F472B6", "#FB923C"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="items-center"
      >
        {/* Hero Image */}
        <Image
          source={require("../assets/girl.png")}
          className="w-full h-[320px]"
          resizeMode="contain"
        />

        {/* Info Content with Blur Effect */}
        <View className="w-full px-8 -mt-24 mb-10 overflow-hidden">
          <BlurView 
            intensity={80} 
            tint="light"
            style={{ borderRadius: 36, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)' }}
          >
            <View className="p-8 items-center">
              <View className="bg-black px-4 py-1.5 rounded-full mb-4 shadow-lg">
                <Text className="text-[10px] font-black text-white uppercase tracking-[2px]">{t.earnTitle}</Text>
              </View>
              
              <Text className="text-[30px] font-black text-black text-center leading-8 mb-3 italic">
                {t.becomeAmbassador}
              </Text>
              
              <Text className="text-sm font-medium text-black/60 text-center mb-8 px-2">
                {t.ambassadorDesc}
              </Text>

              <TouchableOpacity 
                onPress={onPress}
                className="w-full bg-black h-16 rounded-2xl items-center justify-center shadow-xl shadow-black/20"
              >
                <Text className="text-sm font-black text-white uppercase tracking-[2px]">{t.dailyForecastInfo}</Text>
              </TouchableOpacity>

              <View className="mt-6 border-b border-black/10 pb-2 items-center flex-row justify-center">
                <Text className="text-[10px] font-black text-black uppercase tracking-[1px] text-center">
                  {t.futureEarnings}
                </Text>
                <Text className="ml-2 text-xl">💸</Text>
              </View>
            </View>
          </BlurView>
        </View>
      </LinearGradient>
    </View>
  );
};
