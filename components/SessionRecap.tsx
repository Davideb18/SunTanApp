import React, { useEffect, useRef, useState } from "react";
import { View, Text, Image, TouchableOpacity, Alert, Animated, Easing } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Clock, Sun, Zap, Droplet, Camera, X } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";

import { COLORS, formatDuration } from "@/constants/theme";
import { useTranslation } from "@/constants/i18n";
import { GlassCard } from "./GlassCard";

interface SessionRecapProps {
  session: {
    id?: string;
    date?: string;
    mode: string;
    totalSeconds: number;
    uvIndex: number;
    vitD: number;
    sweatMl?: number;
    imageUri?: string | null;
    skinColorHex?: string | null;
  };
  onUpdateImage?: (imageUri: string, detectedColor?: string) => void;
  onClose?: () => void;
  showTitle?: boolean;
  isPremium?: boolean;
  onUpgrade?: () => void;
}

export function SessionRecap({ session, onUpdateImage, onClose, showTitle = true }: SessionRecapProps) {
  const t = useTranslation();
  const [isScanning, setIsScanning] = useState(false);
  const [localUri, setLocalUri] = useState<string | null>(null);
  const scanAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isScanning) {
      scanAnim.setValue(0);
      return;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnim, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(scanAnim, {
          toValue: 0,
          duration: 1200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();
    return () => animation.stop();
  }, [isScanning, scanAnim]);

  const handleImagePicker = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(t.permissionDenied, t.cameraNeeded);
      return;
    }

    Alert.alert(t.addPhoto, t.analyzeProgress, [
      {
        text: t.language === "it" ? "Fotocamera" : "Camera",
        onPress: async () => {
          const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
          });
          if (!result.canceled) {
            const uri = result.assets[0].uri;
            setLocalUri(uri);
            setIsScanning(true);
            setTimeout(() => {
              setIsScanning(false);
              onUpdateImage?.(uri, session.skinColorHex ?? undefined);
            }, 1500);
          }
        },
      },
      {
        text: t.gallery,
        onPress: async () => {
          const result = await ImagePicker.launchImageLibraryAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
          });
          if (!result.canceled) {
            const uri = result.assets[0].uri;
            setLocalUri(uri);
            setIsScanning(true);
            setTimeout(() => {
              setIsScanning(false);
              onUpdateImage?.(uri, session.skinColorHex ?? undefined);
            }, 1500);
          }
        },
      },
      { text: t.discard, style: "cancel" },
    ]);
  };

  const stats = [
    { label: t.durationLabel, value: formatDuration(session.totalSeconds), icon: Clock },
    { label: t.uvPeak, value: session.uvIndex.toFixed(1), icon: Sun },
    { label: t.vitaminD, value: `${session.vitD} ${t.language === "it" ? "UI" : "IU"}`, icon: Zap },
    { label: t.hydration, value: `${session.sweatMl || 0} ML`, icon: Droplet },
  ];

  const translateY = scanAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 256],
  });

  const activeImageUri = localUri || session.imageUri;

  return (
    <View className="items-center w-full">
      {showTitle && (
        <View className="items-center w-full mb-8">
          <View className="w-full flex-row items-center justify-between px-1">
            <View className="h-10 w-10" />
            <View className="bg-accentYellow/30 px-4 py-1.5 rounded-full border border-accentYellow/50">
              <Text className="text-[10px] font-black text-white uppercase tracking-[4px] text-center">{t.missionAccomplished}</Text>
            </View>
            {onClose ? (
              <TouchableOpacity className="h-10 w-10 items-center justify-center rounded-xl bg-white/10 border border-white/20" onPress={onClose}>
                <X size={18} color="white" />
              </TouchableOpacity>
            ) : (
              <View className="h-10 w-10" />
            )}
          </View>

          <Text className="text-[10px] font-bold text-white/40 uppercase tracking-[2px] mb-2 mt-4">
            {session.date
              ? new Date(session.date).toLocaleDateString(t.language === "it" ? "it-IT" : "en-US", { weekday: "long", day: "numeric", month: "long" })
              : new Date().toLocaleDateString(t.language === "it" ? "it-IT" : "en-US", { weekday: "long", day: "numeric", month: "long" })}
          </Text>
          <Text className="text-4xl font-black tracking-[-1px] text-white text-center px-4" numberOfLines={1} adjustsFontSizeToFit>
            RECAP
          </Text>
        </View>
      )}

      <View className="flex-row flex-wrap justify-between gap-y-4 w-full mb-10">
        {stats.map((stat, i) => (
          <View key={i} className="w-[48.5%] aspect-square">
            <GlassCard style={{ padding: 0, borderRadius: 32, overflow: "hidden", borderWidth: 1.5, borderColor: "rgba(255,255,255,0.16)", backgroundColor: "rgba(0,0,0,0.5)" }}>
              <View className="flex-1 items-center justify-center p-6">
                <View className="h-12 w-12 rounded-full bg-white/10 items-center justify-center mb-3 border border-white/20">
                  <stat.icon size={24} color="white" opacity={0.75} />
                </View>
                <Text className="text-[9px] font-black text-white/50 tracking-[1.5px] uppercase text-center mb-2">{stat.label}</Text>
                <Text className="text-3xl font-black text-white text-center tracking-[-1px]">{stat.value}</Text>
              </View>
            </GlassCard>
          </View>
        ))}
      </View>

      <View className="items-center w-full">
        {activeImageUri ? (
          <View className="relative mb-8">
            <View className="h-64 w-64 rounded-[40px] overflow-hidden border-2 border-white/20 bg-black shadow-lg">
              <Image source={{ uri: activeImageUri }} className="h-full w-full" />
              {isScanning && (
                <Animated.View
                  className="absolute left-0 right-0 h-1 bg-accentYellow"
                  style={{
                    transform: [{ translateY }],
                    shadowColor: COLORS.accentYellow,
                    shadowOpacity: 1,
                    shadowRadius: 10,
                    elevation: 8,
                  }}
                />
              )}
            </View>

            {!isScanning && (
              <TouchableOpacity
                className="absolute -top-2 -right-2 h-12 w-12 rounded-full bg-accentYellow items-center justify-center border-4 border-black shadow-lg"
                onPress={handleImagePicker}
              >
                <Camera size={20} color="black" strokeWidth={2.5} />
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <TouchableOpacity className="w-full h-48 rounded-[40px] border-2 border-white/20 bg-white/5 items-center justify-center mb-8 overflow-hidden" onPress={handleImagePicker} activeOpacity={0.8}>
            <LinearGradient colors={["rgba(255,255,255,0.03)", "rgba(0,0,0,0.2)"]} className="absolute inset-0" />
            <View className="h-14 w-14 rounded-full bg-accentYellow/20 items-center justify-center mb-4 border border-accentYellow/40">
              <Camera size={28} color={COLORS.accentYellow} />
            </View>
            <Text className="text-sm font-black text-white uppercase tracking-[2px] text-center">{t.captureProgress}</Text>
            <Text className="text-[10px] font-bold text-white/40 uppercase tracking-[1px] mt-2">{t.language === "it" ? "Tocca per scattare" : "Tap to capture"}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
