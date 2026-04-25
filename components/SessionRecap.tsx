import React, { useState, useRef, useEffect, useCallback } from "react";
import { View, Text, Image, TouchableOpacity, Alert, Animated, Easing, ScrollView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Clock, Sun, Zap, Droplet, Camera, X, ShieldCheck, ChevronRight, Check } from "lucide-react-native";
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { WebView } from 'react-native-webview';

import { COLORS, formatDuration, FITZPATRICK_TYPES } from "@/constants/theme";

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
}

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

export function SessionRecap({ session, onUpdateImage, onClose, showTitle = true }: SessionRecapProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [localUri, setLocalUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const scanAnim = useRef(new Animated.Value(0)).current;
  const scanTimeoutRef = useRef<any>(null);
  
  useEffect(() => {
    if (isScanning) {
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
    } else {
      scanAnim.setValue(0);
    }
  }, [isScanning]);

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
      setLocalUri(null);
      if (onUpdateImage && uri) {
        onUpdateImage(uri, closestTone);
      }
    }, 2000);
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
        setLocalUri(null);
        Alert.alert("Scanner Timeout", "Lighting conditions were too difficult. Please select tone manually.");
      }, 10000);

    } catch (error) {
      console.error(error);
      setIsScanning(false);
    }
  };
  
  const handleImagePicker = async () => {
    if (!onUpdateImage) return;

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert("Permission denied", "Camera access needed.");
      return;
    }

    Alert.alert(
      "Session Photo",
      "Analyze your progress",
      [
        {
          text: "Camera",
          onPress: async () => {
            const result = await ImagePicker.launchCameraAsync({
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.7,
            });
            if (!result.canceled) {
              runScanner(result.assets[0].uri);
            }
          }
        },
        {
          text: "Gallery",
          onPress: async () => {
            const result = await ImagePicker.launchImageLibraryAsync({
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.7,
            });
            if (!result.canceled) {
              runScanner(result.assets[0].uri);
            }
          }
        },
        { text: "Cancel", style: "cancel" }
      ]
    );
  };

  const handleManualToneSelect = (hex: string) => {
    if (onUpdateImage && session.imageUri) {
      onUpdateImage(session.imageUri, hex);
    }
  };

  const stats = [
    { label: "Duration", value: formatDuration(session.totalSeconds), icon: Clock },
    { label: "UV Peak", value: session.uvIndex.toFixed(1), icon: Sun },
    { label: "Vitamin D", value: `${session.vitD} IU`, icon: Zap },
    { label: "Hydration", value: `${session.sweatMl || 0} ML`, icon: Droplet },
  ];

  const translateY = scanAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 256], 
  });

  const activeImageUri = localUri || session.imageUri;

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
            <View className="bg-red-500/30 px-4 py-1.5 rounded-full border border-red-500/50">
              <Text className="text-[10px] font-black text-white uppercase tracking-[4px] text-center">Mission Accomplished</Text>
            </View>
            {onClose ? (
              <TouchableOpacity className="h-10 w-10 items-center justify-center rounded-xl bg-white/10" onPress={onClose}>
                <X size={18} color="white" />
              </TouchableOpacity>
            ) : (
              <View className="h-10 w-10" />
            )}
          </View>

          <Text className="text-[10px] font-bold text-white/40 uppercase tracking-[2px] mb-1 mt-4">
            {session.date 
              ? new Date(session.date).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })
              : new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })
            }
          </Text>
          <Text 
            className="text-7xl font-black tracking-[-2px] text-white text-center px-4"
            style={{ paddingBottom: 10, lineHeight: 80 }}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            RECAP
          </Text>
        </View>
      )}

      <View className="flex-row flex-wrap justify-between gap-y-4 w-full">
        {stats.map((stat, i) => (
          <View 
            key={i} 
            className="w-[48.5%] aspect-square rounded-[32px] overflow-hidden shadow-2xl border-2 border-white/60" 
            style={{ shadowColor: COLORS.accentRed, shadowOpacity: 0.7, shadowRadius: 35 }}
          >
            <LinearGradient 
              colors={i % 2 === 0 ? [COLORS.accentRed, "#ff3333"] : ["#ff3333", COLORS.accentOrange]} 
              start={{ x: 0, y: 0 }} 
              end={{ x: 1, y: 1 }} 
              className="flex-1 items-center justify-center p-6"
            >
              <View className="h-16 w-16 rounded-full bg-white/20 items-center justify-center mb-4">
                <stat.icon size={32} color="white" />
              </View>
              <Text className="text-[12px] font-black text-white/60 tracking-[2px] uppercase text-center mb-4">{stat.label}</Text>
              <Text className="text-4xl font-black text-white text-center tracking-[-2px] mb-4">{stat.value}</Text>
            </LinearGradient>
          </View>
        ))}
      </View>

      <View className="items-center w-full mt-10">
        {activeImageUri ? (
          <View className="relative">
            <View className="h-64 w-64 rounded-[48px] overflow-hidden border-4 border-white shadow-2xl bg-black">
              <Image source={{ uri: activeImageUri }} className="h-full w-full opacity-90" />
              {isScanning && (
                <Animated.View 
                  className="absolute left-0 right-0 h-1.5 bg-accentYellow z-50"
                  style={{ 
                    transform: [{ translateY }], 
                    shadowColor: COLORS.accentYellow, 
                    shadowOpacity: 1, 
                    shadowRadius: 15,
                    elevation: 10 
                  }}
                />
              )}
            </View>

            {session.skinColorHex && !isScanning && (
              <View className="absolute -bottom-4 self-center flex-row items-center bg-black/90 px-5 py-2.5 rounded-full border border-white/20 shadow-2xl z-50">
                 <View className="h-4 w-4 rounded-full mr-3 border border-white/40" style={{ backgroundColor: session.skinColorHex }} />
                 <Text className="text-[11px] font-black text-white uppercase tracking-[1.5px]">Detected Tone</Text>
                 <ShieldCheck size={14} color="#4ADE80" style={{ marginLeft: 8 }} />
              </View>
            )}

            {onUpdateImage && !isScanning && (
              <TouchableOpacity 
                className="absolute -top-2 -right-2 h-12 w-12 rounded-full bg-red-600 items-center justify-center border-4 border-[#121212] z-50"
                onPress={handleImagePicker}
              >
                <Camera size={20} color="white" />
              </TouchableOpacity>
            )}
          </View>
        ) : (
          onUpdateImage && !isScanning && (
            <TouchableOpacity 
              className="w-full h-40 rounded-[48px] border-2 border-dashed border-white/30 bg-white/5 items-center justify-center"
              onPress={handleImagePicker}
            >
              <View className="h-16 w-16 rounded-full bg-white/10 items-center justify-center mb-3">
                <Camera size={32} color="white" opacity={0.6} />
              </View>
              <Text className="text-xs font-black text-white/40 uppercase tracking-[2px]">Capture Progress Glow</Text>
            </TouchableOpacity>
          )
        )}
      </View>

      {activeImageUri && !isScanning && (
        <View className="w-full mt-10 bg-white/5 rounded-[40px] p-8 border border-white/10">
          <View className="flex-row items-center justify-between mb-6">
            <View>
              <Text className="text-[14px] font-black text-white uppercase tracking-[3px]">Manual Refinement</Text>
              <Text className="text-[10px] font-bold text-white/30 uppercase tracking-[1px] mt-1">Adjust if detection was off</Text>
            </View>
            <ShieldCheck size={20} color="rgba(255,255,255,0.2)" />
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-4">
              {FITZPATRICK_TYPES.map((type) => {
                const isSelected = session.skinColorHex === type.hex;
                return (
                  <TouchableOpacity
                    key={type.level}
                    onPress={() => handleManualToneSelect(type.hex)}
                    className={`h-16 w-16 rounded-[24px] items-center justify-center border-2 ${isSelected ? 'border-accentYellow bg-accentYellow/20' : 'border-white/10 bg-white/5'}`}
                    style={isSelected ? { shadowColor: COLORS.accentYellow, shadowOpacity: 0.3, shadowRadius: 10 } : {}}
                  >
                    <View className="h-10 w-10 rounded-full border-2 border-white/20" style={{ backgroundColor: type.hex }} />
                    {isSelected && (
                      <View className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-accentYellow items-center justify-center border-2 border-black">
                        <Check size={12} color="black" strokeWidth={4} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>
      )}
    </View>
  );
}
