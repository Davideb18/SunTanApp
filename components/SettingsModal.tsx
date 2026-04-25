import React from "react";
import { View, Text, Modal, TouchableOpacity, ScrollView, Switch, Share } from "react-native";
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
import { COLORS } from "@/constants/theme";

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

  const [legalVisible, setLegalVisible] = React.useState(false);
  const [legalType, setLegalType] = React.useState<"privacy" | "terms">("privacy");

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
      disabled={isSwitch}
      className="flex-row items-center justify-between py-4 border-b border-white/5"
    >
      <View className="flex-row items-center">
        <View className="h-9 w-9 items-center justify-center rounded-xl bg-white/5">
          <Icon size={18} color="white" opacity={0.6} />
        </View>
        <Text className="ml-4 text-[15px] font-bold text-white">{label}</Text>
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
            {value && <Text className="mr-3 text-sm font-black text-white/30 uppercase">{value}</Text>}
            {showChevron && <ChevronRight size={16} color="white" opacity={0.2} />}
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
              <Text className="text-2xl font-black text-white">Settings</Text>
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
                    <Text className="text-sm font-black text-accentYellow uppercase tracking-[1px]">Premium Access</Text>
                    <Text className="text-xl font-black text-white mt-1">{hasPremium ? "Active Subscription" : "Upgrade to Pro"}</Text>
                  </View>
                  <TouchableOpacity 
                    onPress={() => setHasPremium(!hasPremium)}
                    className="bg-accentYellow px-4 py-2 rounded-xl"
                  >
                    <Text className="text-xs font-black text-black">{hasPremium ? "MANAGE" : "UPGRADE"}</Text>
                  </TouchableOpacity>
                </View>
              </GlassCard>

              {/* Preferences */}
              <View className="mt-10 mb-4">
                <Text className="text-[10px] font-black text-white/30 uppercase tracking-[2px] mb-4">Preferences</Text>
                <GlassCard style={{ borderRadius: 32, padding: 20, backgroundColor: "rgba(0,0,0,0.5)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" }}>
                  <SettingRow 
                    icon={Globe} 
                    label="Language" 
                    value={language === "en" ? "English" : "Italiano"} 
                    onPress={() => setLanguage(language === "en" ? "it" : "en")}
                  />
                  <SettingRow 
                    icon={Ruler} 
                    label="Units of Measure" 
                    value={units} 
                    onPress={() => setUnits(units === "metric" ? "imperial" : "metric")}
                  />
                  <SettingRow 
                    icon={Bell} 
                    label="Notifications" 
                    isSwitch={true}
                    switchValue={notificationsEnabled}
                    onSwitchChange={setNotificationsEnabled}
                  />
                  <SettingRow 
                    icon={Dna} 
                    label="Vitamin D Goal" 
                    value={`${vitDGoalIU / 1000}k IU`} 
                    onPress={() => setVitDGoalIU(vitDGoalIU >= 30000 ? 5000 : vitDGoalIU + 5000)}
                  />
                </GlassCard>
              </View>

              {/* Community & Rewards */}
              <View className="mt-6 mb-4">
                <Text className="text-[10px] font-black text-white/30 uppercase tracking-[2px] mb-4">Community</Text>
                <GlassCard style={{ borderRadius: 32, padding: 20, backgroundColor: "rgba(0,0,0,0.5)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" }}>
                  <SettingRow 
                    icon={Gift} 
                    label="Referral Code" 
                    value="SUN20" 
                    onPress={() => {}}
                  />
                  <SettingRow 
                    icon={Heart} 
                    label="Invite Friends" 
                    onPress={handleInvite}
                  />
                  <SettingRow 
                    icon={Star} 
                    label="Request Features" 
                    onPress={() => {}}
                  />
                </GlassCard>
              </View>

              {/* Support & Info */}
              <View className="mt-6 mb-4">
                <Text className="text-[10px] font-black text-white/30 uppercase tracking-[2px] mb-4">Support</Text>
                <GlassCard style={{ borderRadius: 32, padding: 20, backgroundColor: "rgba(0,0,0,0.5)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" }}>
                  <SettingRow 
                    icon={LifeBuoy} 
                    label="Help Center" 
                    onPress={() => {}}
                  />
                  <SettingRow 
                    icon={Mail} 
                    label="Contact Us" 
                    onPress={() => {}}
                  />
                  <SettingRow 
                    icon={FileText} 
                    label="Legal & Privacy" 
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
                <Text className="ml-3 text-lg font-black uppercase tracking-[2px] text-white">Sign Out & Reset</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </GradientBackground>

        <LegalModal 
          visible={legalVisible} 
          type={legalType} 
          onClose={() => setLegalVisible(false)} 
        />
      </View>
    </Modal>
  );
};
