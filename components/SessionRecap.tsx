import React, { useEffect, useRef, useState } from "react";
import { View, Text, Image, TouchableOpacity, Alert, Animated, Easing } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Clock, Sun, Zap, Droplet, Camera, X, Lock, Check } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from 'expo-image-manipulator';
import { WebView } from 'react-native-webview';

import { COLORS, formatDuration, FITZPATRICK_TYPES } from "@/constants/theme";
import { useTranslation } from "@/constants/i18n";
import { GlassCard } from "./GlassCard";

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

// --- Color Math Helpers ---
const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

const getColorDistance = (color1: string, color2: string) => {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  if (!rgb1 || !rgb2) return Infinity;
  return Math.sqrt(
    Math.pow(rgb1.r - rgb2.r, 2) +
    Math.pow(rgb1.g - rgb2.g, 2) +
    Math.pow(rgb1.b - rgb2.b, 2)
  );
};

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

export function SessionRecap({ session, onUpdateImage, onClose, showTitle = true, isPremium = false, onUpgrade }: SessionRecapProps) {
  const t = useTranslation();
  const [isScanning, setIsScanning] = useState(false);
  const [localUri, setLocalUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const scanAnim = useRef(new Animated.Value(0)).current;
  const scanTimeoutRef = useRef<any>(null);

  useEffect(() => {
    if (!isScanning) {
      scanAnim.setValue(0);
      return;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(scanAnim, {
          toValue: 0,
          duration: 1500,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();
    return () => animation.stop();
  }, [isScanning, scanAnim]);

  const onScanResult = (detectedHex: string) => {
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
      scanTimeoutRef.current = null;
    }

    // Find closest Fitzpatrick tone
    let closestTone = FITZPATRICK_TYPES[0].hex;
    let minDistance = Infinity;

    FITZPATRICK_TYPES.forEach(type => {
      const dist = getColorDistance(detectedHex, type.hex);
      if (dist < minDistance) {
        minDistance = dist;
        closestTone = type.hex;
      }
    });

    setTimeout(() => {
      setIsScanning(false);
      const uri = localUri;
      setImageBase64(null);
      if (onUpdateImage && uri) {
        onUpdateImage(uri, closestTone);
      }
    }, 2500);
  };

  const runScanner = async (uri: string) => {
    try {
      setLocalUri(uri);
      setIsScanning(true);

      const result = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 50, height: 50 } }],
        { base64: true, format: ImageManipulator.SaveFormat.JPEG }
      );

      setImageBase64(`data:image/jpeg;base64,${result.base64}`);

      scanTimeoutRef.current = setTimeout(() => {
        setIsScanning(false);
        setImageBase64(null);
        Alert.alert(t.scannerTimeout || "Timeout", t.scannerError || "Could not analyze skin tone.");
      }, 10000);

    } catch (error) {
      console.error(error);
      setIsScanning(false);
    }
  };

  const handleImagePicker = async () => {
    // We now allow everyone to scan, but we'll show a warning for non-premium users

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
            runScanner(result.assets[0].uri);
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
            runScanner(result.assets[0].uri);
          }
        },
      },
      { text: t.discard, style: "cancel" },
    ]);
  };

  const webViewScript = `
    (function() {
      const img = new Image();
      img.onload = function() {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = 10;
          canvas.height = 10;
          ctx.drawImage(img, 0, 0, 10, 10);
          const data = ctx.getImageData(5, 5, 1, 1).data;
          const hex = "#" + ("000000" + ((data[0] << 16) | (data[1] << 8) | data[2]).toString(16)).slice(-6);
          window.ReactNativeWebView.postMessage(hex);
        } catch (e) {
          window.ReactNativeWebView.postMessage("error");
        }
      };
      img.onerror = function() {
        window.ReactNativeWebView.postMessage("error");
      };
      img.src = "${imageBase64}";
    })();
  `;

  const stats = [
    { label: t.durationLabel, value: formatDuration(session.totalSeconds), icon: Clock, color: "white" },
    { label: t.uvPeak, value: session.uvIndex.toFixed(1), icon: Sun, color: COLORS.accentYellow },
    { label: t.vitaminD, value: `${session.vitD} ${t.language === "it" ? "UI" : "IU"}`, icon: Zap, color: "#A78BFA" },
    { label: t.hydration, value: `${session.sweatMl || 0} ML`, icon: Droplet, color: "#60A5FA" },
  ];

  const translateY = scanAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 280],
  });

  const activeImageUri = localUri || session.imageUri;

  return (
    <View className="items-center w-full">
      {imageBase64 && (
        <View style={{ height: 0, width: 0, opacity: 0, position: 'absolute' }}>
          <WebView
            originWhitelist={['*']}
            source={{ html: '<html><body></body></html>' }}
            injectedJavaScript={webViewScript}
            onMessage={(event) => {
              if (event.nativeEvent.data === "error") {
                if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current);
                setIsScanning(false);
                setImageBase64(null);
              } else {
                onScanResult(event.nativeEvent.data);
              }
            }}
            javaScriptEnabled={true}
          />
        </View>
      )}
      {showTitle && (
        <View className="items-center w-full mb-8">
          <View className="w-full flex-row items-center justify-between px-1">
            <View className="h-10 w-10" />
            <View className="bg-white/10 px-4 py-2 rounded-2xl border border-white/20 backdrop-blur-md">
              <Text className="text-[10px] font-black text-white uppercase tracking-[4px] text-center">{t.missionAccomplished} ☀️</Text>
            </View>
            {onClose ? (
              <TouchableOpacity className="h-11 w-11 items-center justify-center rounded-2xl bg-white/10 border border-white/20" onPress={onClose}>
                <X size={20} color="white" />
              </TouchableOpacity>
            ) : (
              <View className="h-11 w-11" />
            )}
          </View>

          <View className="items-center mt-6">
            <Text className="text-[11px] font-black text-white/30 uppercase tracking-[3px] mb-2">
              {session.date
                ? new Date(session.date).toLocaleDateString(t.language === "it" ? "it-IT" : "en-US", { weekday: "long", day: "numeric", month: "long" })
                : new Date().toLocaleDateString(t.language === "it" ? "it-IT" : "en-US", { weekday: "long", day: "numeric", month: "long" })}
            </Text>
            <Text className="text-5xl font-black tracking-[-2px] text-white text-center">
              {t.sessionSaved}
            </Text>
          </View>
        </View>
      )}

      {/* Stats Grid */}
      <View className="flex-row flex-wrap justify-between gap-y-4 w-full mb-10">
        {stats.map((stat, i) => (
          <View key={i} className="w-[48.5%]">
            <GlassCard style={{ padding: 20, borderRadius: 32, borderWidth: 2, borderColor: "#FFFFFF", backgroundColor: "rgba(0,0,0,0.6)", shadowColor: "#000", shadowOpacity: 0.6, shadowRadius: 25, elevation: 20 }}>
              <View className="items-center justify-center">
                <View className="h-12 w-12 rounded-2xl bg-white/5 items-center justify-center mb-4 border border-white/10">
                  <stat.icon size={22} color={stat.color} opacity={0.9} />
                </View>
                <Text className="text-[9px] font-black text-white/40 tracking-[2px] uppercase text-center mb-1.5">{stat.label}</Text>
                <Text className="text-[26px] font-black text-white text-center tracking-[-1px]">{stat.value}</Text>
              </View>
            </GlassCard>
          </View>
        ))}
      </View>

      {/* Progress Capture Section */}
      <View className="w-full">
        <View className="flex-row items-center mb-6">
          <Camera size={20} color={COLORS.accentYellow} />
          <Text className="ml-3 text-xl font-black text-white">{t.scanner}</Text>
        </View>

        {activeImageUri ? (
          <>
            <View 
              style={{ 
                borderRadius: 44, 
                borderWidth: 5, 
                borderColor: session.skinColorHex || "#FFFFFF", 
                overflow: 'hidden',
                backgroundColor: 'black'
              }}
              className="shadow-2xl"
            >
              <View className="h-[320px] w-full">
                <Image 
                  source={{ uri: activeImageUri }} 
                  className="h-full w-full" 
                  style={{ opacity: isScanning ? 0.6 : 1 }} 
                  blurRadius={(isPremium || !!localUri) ? 0 : 20} 
                />
                
                {isScanning && (
                  <>
                    <AnimatedLinearGradient
                      colors={['transparent', 'rgba(250, 204, 21, 0.4)', 'transparent']}
                      className="absolute left-0 right-0 h-32"
                      style={{ transform: [{ translateY: scanAnim.interpolate({ inputRange: [0, 1], outputRange: [-120, 320] }) }] }}
                    />
                    <Animated.View
                      className="absolute left-0 right-0 h-[4px] bg-accentYellow"
                      style={{
                        transform: [{ translateY: scanAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 320] }) }],
                        shadowColor: COLORS.accentYellow,
                        shadowOpacity: 1,
                        shadowRadius: 20,
                        elevation: 15,
                      }}
                    />
                  </>
                )}

                {session.skinColorHex && !isScanning && (
                   <View className="absolute top-4 left-4 bg-black/70 px-4 py-2 rounded-full border border-white/30 flex-row items-center shadow-2xl">
                      <View className="h-3 w-3 rounded-full mr-2.5" style={{ backgroundColor: session.skinColorHex, shadowColor: session.skinColorHex, shadowOpacity: 1, shadowRadius: 10 }} />
                      <Text className="text-[10px] font-black text-white uppercase tracking-[1.5px]">{t.detectedTone}</Text>
                   </View>
                )}
              </View>
            </View>
            
            {!isPremium && activeImageUri && !isScanning && (
              <TouchableOpacity 
                activeOpacity={0.9}
                onPress={onUpgrade}
                className="mt-6 bg-accentYellow border-2 border-white/50 p-5 rounded-[32px] flex-row items-center shadow-2xl"
              >
                <View className="h-10 w-10 rounded-full bg-black items-center justify-center mr-4">
                  <Lock size={18} color={COLORS.accentYellow} />
                </View>
                <View className="flex-1">
                  <Text className="text-[12px] font-black text-black uppercase tracking-[0.5px] leading-[16px]">
                    {t.unlockPhoto}
                  </Text>
                  <Text className="text-[9px] font-bold text-black/50 uppercase mt-1">
                    {t.recapPremiumSubtitle}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          </>
        ) : (
          <TouchableOpacity 
            onPress={handleImagePicker} 
            activeOpacity={0.8}
            className="w-full h-56 rounded-[44px] overflow-hidden border-2 border-dashed border-white/20 bg-white/5 items-center justify-center shadow-2xl"
          >
            <Image source={require("@/assets/analyze.png")} className="absolute h-full w-full opacity-5" resizeMode="cover" />
            <LinearGradient colors={["rgba(255,255,255,0.05)", "rgba(0,0,0,0.2)"]} className="absolute inset-0" />
            
            <View className="items-center">
               <View className="h-16 w-16 rounded-full bg-white/5 items-center justify-center mb-5 border border-white/10">
                 <Camera size={32} color="white" opacity={0.4} />
               </View>
               <Text className="text-lg font-black text-white uppercase tracking-[3px]">{t.scanner}</Text>
               <Text className="text-[10px] font-bold text-white/40 uppercase tracking-[1.5px] mt-2">
                 {t.language === "it" ? "Tocca per scansionare la pelle" : "Tap to scan your skin tone"}
               </Text>
            </View>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
