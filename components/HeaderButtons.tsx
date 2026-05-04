import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { COLORS } from "@/constants/theme";
import { useTranslation } from "@/constants/i18n";

interface HeaderButtonsProps {
  onPartnerPress: () => void;
  onProPress: () => void;
}

export const HeaderButtons = ({ onPartnerPress, onProPress }: HeaderButtonsProps) => {
  const t = useTranslation();
  
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <TouchableOpacity 
        onPress={onPartnerPress}
        style={{
          height: 40,
          minWidth: 44,
          paddingHorizontal: 8,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.28)',
          backgroundColor: 'rgba(249,115,22,0.92)',
          justifyContent: 'center',
          shadowColor: '#000',
          shadowOpacity: 0.22,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 4 },
          elevation: 4
        }}
      >
        <Text style={{ fontSize: 18, fontWeight: '900', color: '#fff', textAlign: 'center' }}>💰</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        onPress={onProPress}
        style={{
          height: 40,
          minWidth: 72,
          paddingHorizontal: 14,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.28)',
          backgroundColor: 'rgba(255,255,255,0.92)',
          justifyContent: 'center',
          shadowColor: '#000',
          shadowOpacity: 0.22,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 4 },
          elevation: 4
        }}
      >
        <Text style={{ fontSize: 13, fontWeight: '900', color: '#000', letterSpacing: -0.3, textAlign: 'center' }}>{t.pro}</Text>
      </TouchableOpacity>
    </View>
  );
};
