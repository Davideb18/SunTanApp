import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Modal, ScrollView, TextInput, ActivityIndicator, Pressable } from "react-native";
import { MapPin, X, Navigation, Check, Search, ChevronRight } from "lucide-react-native";
import { useAppStore } from "@/store/useAppStore";
import { useTranslation } from "@/constants/i18n";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ExpoLocation from "expo-location";
import { COLORS } from "@/constants/theme";

interface LocationModalProps {
  visible: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

export function LocationModal({ visible, onClose, onRefresh }: LocationModalProps) {
  const t = useTranslation();
  const insets = useSafeAreaInsets();
  const mockLocation = useAppStore((s) => s.mockLocation);
  const setMockLocation = useAppStore((s) => s.setMockLocation);
  const locationName = useAppStore((s) => s.locationName);
  const gpsLocationName = useAppStore((s) => s.gpsLocationName);
  const setGpsLocationName = useAppStore((s) => s.setGpsLocationName);

  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 3) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(searchQuery)}&count=8&language=en&format=json`);
        const data = await response.json();
        setResults(data.results || []);
      } catch (error) {
        console.error("Geocoding error:", error);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);
  
  useEffect(() => {
    if (!gpsLocationName && visible) {
       (async () => {
         try {
           const { status } = await ExpoLocation.getForegroundPermissionsAsync();
           if (status === 'granted') {
             const location = await ExpoLocation.getCurrentPositionAsync({ accuracy: ExpoLocation.Accuracy.Low });
             const geocode = await ExpoLocation.reverseGeocodeAsync({ 
               latitude: location.coords.latitude, 
               longitude: location.coords.longitude 
             });
             const name = geocode[0]?.city || geocode[0]?.region || "Your Area";
             setGpsLocationName(name);
           }
         } catch (e) {
           console.log("Silent GPS fetch failed", e);
         }
       })();
    }
  }, [visible, gpsLocationName]);

  const handleSelect = (loc: { name: string, lat: number, lon: number } | null) => {
    setMockLocation(loc);
    onClose();
    setTimeout(onRefresh, 300);
  };

  return (
    <Modal visible={visible} transparent={false} animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: '#090909', paddingTop: insets.top }}>
        {/* Header */}
        <View className="px-6 py-4 flex-row items-center justify-between border-b border-white/5">
          <Text className="text-2xl font-black text-white">{t.selectLocation}</Text>
          <TouchableOpacity onPress={onClose} className="h-10 w-10 items-center justify-center rounded-full bg-white/10">
            <X size={20} color="white" />
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* Search Bar */}
          <View className="my-6 flex-row items-center rounded-2xl bg-white/5 border border-white/10 px-4 py-3">
            <Search size={18} color="white" opacity={0.4} />
            <TextInput
              placeholder={t.searchCity}
              placeholderTextColor="rgba(255,255,255,0.3)"
              className="ml-3 flex-1 text-white font-bold"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus={false}
            />
            {searchQuery.length > 0 && !loading && (
              <TouchableOpacity onPress={() => setSearchQuery("")} className="p-1">
                <X size={16} color="white" opacity={0.5} />
              </TouchableOpacity>
            )}
            {loading && <ActivityIndicator size="small" color={COLORS.accentYellow} />}
          </View>

          {/* Current Location */}
          <TouchableOpacity
            onPress={() => handleSelect(null)}
            className={`mb-4 flex-row items-center justify-between rounded-2xl border p-5 ${!mockLocation ? 'border-accentYellow bg-accentYellow/10' : 'border-white/10 bg-white/5'}`}
          >
            <View className="flex-row items-center">
              <View className="h-10 w-10 items-center justify-center rounded-full bg-white/5">
                <Navigation size={20} color={!mockLocation ? COLORS.accentYellow : 'white'} />
              </View>
              <View className="ml-4">
                <Text className={`font-black uppercase tracking-[1px] ${!mockLocation ? 'text-accentYellow' : 'text-white'}`}>{t.currentLocation}</Text>
                <Text className="text-xs text-white/40 mt-0.5">{gpsLocationName || t.gpsDetection}</Text>
              </View>
            </View>
            {!mockLocation && <Check size={20} color={COLORS.accentYellow} />}
          </TouchableOpacity>

          <View className="h-[1px] bg-white/5 my-4" />

          {/* Search Results */}
          {results.length > 0 ? (
            <View>
              <Text className="mb-4 text-[10px] font-black uppercase tracking-[2px] text-white/30">{t.searchResults || "Search Results"}</Text>
              {results.map((res) => (
                <TouchableOpacity
                  key={`${res.id}-${res.latitude}`}
                  onPress={() => handleSelect({ name: res.name, lat: res.latitude, lon: res.longitude })}
                  className="mb-3 flex-row items-center justify-between rounded-2xl bg-white/5 border border-white/10 p-5"
                >
                  <View>
                    <Text className="font-black text-white">{res.name}</Text>
                    <Text className="text-xs text-white/40 mt-0.5">{res.admin1 ? `${res.admin1}, ` : ""}{res.country}</Text>
                  </View>
                  <ChevronRight size={18} color="white" opacity={0.3} />
                </TouchableOpacity>
              ))}
            </View>
          ) : searchQuery.length >= 3 && !loading ? (
            <View className="py-10 items-center">
              <Text className="text-white/40 font-bold">{t.noCitiesFound}</Text>
            </View>
          ) : !searchQuery && (
             <View className="py-10 items-center">
               <MapPin size={48} color="white" opacity={0.05} />
               <Text className="text-white/20 font-black mt-4 uppercase tracking-[2px]">{t.enterCityName}</Text>
             </View>
          )}
          
          <View className="h-20" />
        </ScrollView>
      </View>
    </Modal>
  );
}

