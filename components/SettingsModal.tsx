import React from "react";
import { View, Text, Modal, TouchableOpacity, ScrollView, Switch, Share, Linking } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { 
  X, ChevronRight, Globe, Zap, Ruler, 
  Dna, FileText, LifeBuoy, Mail, Gift, 
  Bell, Heart, Star, LogOut 
} from "lucide-react-native";
import { useAppStore } from "@/store/useAppStore";
import { GlassCard } from "./GlassCard";
import { GradientBackground } from "./GradientBackground";
import { LegalModal } from "./LegalModal";
import { PremiumModal } from "./PremiumModal";
import { COLORS } from "@/constants/theme";
import { useTranslation } from "@/constants/i18n";

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ visible, onClose }) => {
  const insets = useSafeAreaInsets();
  const { 
    language, setLanguage,
    units, setUnits,
    notificationsEnabled, setNotificationsEnabled,
    vitDGoalIU, setVitDGoalIU,
    hasPremium, setHasPremium,
    resetProfile
  } = useAppStore();

  const t = useTranslation();

  const [legalVisible, setLegalVisible] = React.useState(false);
  const [legalType, setLegalType] = React.useState<"privacy" | "terms">("privacy");
  const [premiumVisible, setPremiumVisible] = React.useState(false);

  const openLegal = (type: "privacy" | "terms") => {
    setLegalType(type);
    setLegalVisible(true);
  };

  const handleInvite = async () => {
    try {
      await Share.share({
        message: "Join me on Glowy and get 20% off Premium! Use my code: GLOWY20",
      });
    } catch (error) {
      console.error(error);
    }
  };

  const SettingRow = ({ 
    icon: Icon, 
    label, 
    value, 
    onPress, 
    showChevron = true,
    isSwitch = false,
    switchValue = false,
    onSwitchChange = () => {}
  }: any) => (
    <TouchableOpacity 
      activeOpacity={0.7} 
      onPress={onPress}
      disabled={isSwitch || !onPress}
      className={`flex-row items-center justify-between py-4 border-b border-white/5 ${!isSwitch && !onPress ? 'opacity-40' : ''}`}
    >
      <View className="flex-row items-center">
        <View className="h-9 w-9 items-center justify-center rounded-xl bg-white/10 border border-white/20">
          <Icon size={18} color="white" opacity={0.9} />
        </View>
        <Text className="ml-4 text-[15px] font-black text-white">{label}</Text>
      </View>
      
      <View className="flex-row items-center">
        {isSwitch ? (
          <Switch 
            value={switchValue} 
            onValueChange={onSwitchChange}
            trackColor={{ false: "#3e3e3e", true: COLORS.accentYellow }}
            thumbColor={switchValue ? "#FFF" : "#f4f3f4"}
          />
        ) : (
          <>
            {value && <Text className="mr-3 text-sm font-black text-white uppercase tracking-[1px]">{value}</Text>}
            {showChevron && onPress && <ChevronRight size={18} color={COLORS.accentYellow} opacity={0.9} />}
            {showChevron && !onPress && <ChevronRight size={16} color="white" opacity={0.2} />}
          </>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View className="flex-1 bg-black">
        <GradientBackground>
          <View className="flex-1" style={{ paddingTop: insets.top }}>
            {/* Header */}
            <View className="flex-row items-center justify-between px-6 py-4">
              <Text className="text-2xl font-black text-white">{t.settings}</Text>
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
              contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
            >
              {/* Premium Section */}
              <GlassCard style={{ padding: 20, marginTop: 10, borderRadius: 32, backgroundColor: "rgba(255,222,0,0.05)", borderColor: COLORS.accentYellow, borderWidth: 1 }}>
                <View className="flex-row items-center justify-between">
                  <View>
                    <Text className="text-sm font-black text-accentYellow uppercase tracking-[1px]">{t.premiumAccess}</Text>
                    <Text className="text-xl font-black text-white mt-1">{hasPremium ? t.activeSubscription : t.upgradeToPro}</Text>
                  </View>
                  <TouchableOpacity 
                    onPress={() => setPremiumVisible(true)}
                    className="bg-accentYellow px-4 py-2 rounded-xl"
                  >
                    <Text className="text-xs font-black text-black">{hasPremium ? t.manage : t.upgrade}</Text>
                  </TouchableOpacity>
                </View>
              </GlassCard>

              {/* Preferences */}
              <View className="mt-10 mb-4">
                <Text className="text-[10px] font-black text-white uppercase tracking-[2px] mb-4">{t.preferences}</Text>
                <GlassCard style={{ borderRadius: 32, padding: 20, backgroundColor: "rgba(0,0,0,0.7)", borderWidth: 1.5, borderColor: "#FFFFFF", shadowColor: "#000", shadowOpacity: 0.6, shadowRadius: 25, elevation: 20 }}>
                  <SettingRow 
                    icon={Globe} 
                    label={t.language} 
                    value={language === "en" ? "English" : "Italiano"} 
                    onPress={() => setLanguage(language === "en" ? "it" : "en")}
                  />
                  <SettingRow 
                    icon={Ruler} 
                    label={t.unitsOfMeasure} 
                    value={units === "metric" ? "Metric (°C)" : "Imperial (°F)"} 
                    onPress={() => setUnits(units === "metric" ? "imperial" : "metric")}
                  />
                  <SettingRow 
                    icon={Bell} 
                    label={t.notifications} 
                    isSwitch={true}
                    switchValue={notificationsEnabled}
                    onSwitchChange={setNotificationsEnabled}
                  />
                  <SettingRow 
                    icon={Dna} 
                    label={t.vitaminDGoal} 
                    value={`${vitDGoalIU / 1000}k ${t.language === 'it' ? "UI" : "IU"}`} 
                    onPress={() => setVitDGoalIU(vitDGoalIU >= 30000 ? 5000 : vitDGoalIU + 5000)}
                  />
                </GlassCard>
              </View>

              {/* Community & Rewards */}
              <View className="mt-6 mb-4">
                <Text className="text-[10px] font-black text-white uppercase tracking-[2px] mb-4">{t.community}</Text>
                <GlassCard style={{ borderRadius: 32, padding: 20, backgroundColor: "rgba(0,0,0,0.7)", borderWidth: 1.5, borderColor: "#FFFFFF", shadowColor: "#000", shadowOpacity: 0.6, shadowRadius: 25, elevation: 20 }}>

                  <SettingRow 
                    icon={Heart} 
                    label={t.inviteFriends} 
                    onPress={handleInvite}
                  />
                  <SettingRow 
                    icon={Star} 
                    label={t.requestFeatures} 
                    onPress={undefined}
                    value={t.soon}
                  />
                </GlassCard>
              </View>

              {/* Support & Info */}
              <View className="mt-6 mb-4">
                <Text className="text-[10px] font-black text-white uppercase tracking-[2px] mb-4">{t.support}</Text>
                <GlassCard style={{ borderRadius: 32, padding: 20, backgroundColor: "rgba(0,0,0,0.7)", borderWidth: 1.5, borderColor: "#FFFFFF", shadowColor: "#000", shadowOpacity: 0.6, shadowRadius: 25, elevation: 20 }}>
                  <SettingRow 
                    icon={LifeBuoy} 
                    label={t.helpCenter} 
                    onPress={() => Linking.openURL("https://glowyapp.com/help")}
                  />
                  <SettingRow 
                    icon={Mail} 
                    label={t.contactUs} 
                    onPress={() => Linking.openURL("mailto:glowyapp.help@gmail.com")}
                  />
                  <SettingRow 
                    icon={FileText} 
                    label={t.legalPrivacy} 
                    onPress={() => openLegal("privacy")}
                  />
                </GlassCard>
              </View>

              {/* Sign Out */}
              <TouchableOpacity 
                onPress={resetProfile}
                className="mt-12 flex-row items-center justify-center py-7 bg-red-600 rounded-[32px] shadow-lg shadow-red-500/50"
                activeOpacity={0.8}
              >
                <LogOut size={22} color="white" />
                <Text className="ml-3 text-lg font-black uppercase tracking-[2px] text-white">{t.signOutReset}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </GradientBackground>

        <PremiumModal 
          visible={premiumVisible} 
          onClose={() => setPremiumVisible(false)} 
        />
        
        <LegalModal 
          visible={legalVisible} 
          type={legalType} 
          onClose={() => setLegalVisible(false)} 
        />
      </View>
    </Modal>
  );
};
