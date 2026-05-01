import React from "react";
import { View, Text, TouchableOpacity, Modal, ScrollView, ActivityIndicator, Alert } from "react-native";
import { X, Check, ShieldCheck } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS } from "@/constants/theme";
import { useTranslation } from "@/constants/i18n";
import { useRevenueCat } from "@/hooks/useRevenueCat";
import { PACKAGE_TYPE } from "react-native-purchases";

interface PremiumModalProps {
  visible: boolean;
  onClose: () => void;
}

export function PremiumModal({ visible, onClose }: PremiumModalProps) {
  const t = useTranslation();
  const { packages, purchasePackage, restorePurchases } = useRevenueCat();
  const [loading, setLoading] = React.useState(false);
  
  const features = [
    t.feat1,
    t.feat2,
    t.feat3,
    t.feat4,
    t.feat5,
    t.feat6
  ];

  const handlePurchase = async (pack: any) => {
    setLoading(true);
    const success = await purchasePackage(pack);
    setLoading(false);
    if (success) {
      Alert.alert(t.language === 'it' ? "Successo" : "Success", t.language === 'it' ? "Ora sei un utente Pro!" : "You are now a Pro user!");
      onClose();
    }
  };

  const handleRestore = async () => {
    setLoading(true);
    const success = await restorePurchases();
    setLoading(false);
    if (success) {
      Alert.alert(t.language === 'it' ? "Ripristinato" : "Restored", t.language === 'it' ? "Abbonamento ripristinato con successo." : "Subscription restored successfully.");
      onClose();
    } else {
      Alert.alert(t.language === 'it' ? "Errore" : "Error", t.language === 'it' ? "Nessun abbonamento trovato." : "No subscription found.");
    }
  };

  // Find specific packages
  const annual = packages.find(p => p.packageType === PACKAGE_TYPE.ANNUAL);
  const quarterly = packages.find(p => p.packageType === PACKAGE_TYPE.THREE_MONTH);
  const monthly = packages.find(p => p.packageType === PACKAGE_TYPE.MONTHLY);

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View className="flex-1 bg-black/95">
        <LinearGradient
          colors={['#1a1a1a', '#000']}
          className="flex-1 px-6"
        >
          <View className="flex-row justify-between items-center pt-14 mb-8">
            <TouchableOpacity onPress={handleRestore}>
               <Text className="text-white/40 text-[10px] font-black uppercase tracking-[1px]">Restore</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose} className="h-10 w-10 bg-white/10 rounded-full items-center justify-center">
              <X size={20} color="white" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View className="items-center mb-10">
              <View className="h-20 w-20 bg-accentYellow rounded-[24px] items-center justify-center mb-6 shadow-lg shadow-accentYellow/20">
                <ShieldCheck size={40} color="black" />
              </View>
              <Text className="text-4xl font-black text-white text-center tracking-[-1px]">{t.premiumTitle}</Text>
              <Text className="text-accentYellow font-black text-sm uppercase tracking-[3px] mt-2">{t.premiumSubtitle}</Text>
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

            <View className="gap-y-4 mb-10">
              {loading ? (
                <ActivityIndicator color={COLORS.accentYellow} size="large" />
              ) : (
                <>
                  {/* ANNUAL */}
                  <TouchableOpacity 
                    onPress={() => annual && handlePurchase(annual)}
                    className="relative overflow-hidden bg-white p-6 rounded-[32px] items-center border-2 border-accentYellow"
                  >
                    <View className="absolute top-0 right-0 bg-accentYellow px-4 py-1 rounded-bl-2xl">
                      <Text className="text-[10px] font-black text-black">BEST VALUE</Text>
                    </View>
                    <Text className="text-black font-black text-xl uppercase">{t.annualElite || "Annual Elite"}</Text>
                    <View className="flex-row items-center mt-1">
                      <Text className="text-black font-black text-lg">{annual?.product.priceString || "€39.99"}</Text>
                      <Text className="ml-2 text-black/30 font-bold text-xs">/ year</Text>
                    </View>
                  </TouchableOpacity>

                  {/* QUARTERLY */}
                  <TouchableOpacity 
                    onPress={() => quarterly && handlePurchase(quarterly)}
                    className="bg-white/10 p-6 rounded-[32px] items-center border border-white/20"
                  >
                    <Text className="text-white font-black text-xl uppercase">{t.quarterlyPro || "Quarterly Pro"}</Text>
                    <View className="flex-row items-center mt-1">
                      <Text className="text-white font-black text-lg">{quarterly?.product.priceString || "€19.99"}</Text>
                      <Text className="ml-2 text-white/30 font-bold text-xs">/ 3 months</Text>
                    </View>
                  </TouchableOpacity>

                  {/* MONTHLY */}
                  <TouchableOpacity 
                    onPress={() => monthly && handlePurchase(monthly)}
                    className="bg-white/10 p-6 rounded-[32px] items-center border border-white/20"
                  >
                    <Text className="text-white font-black text-xl uppercase">{t.monthlyPass || "Monthly Pass"}</Text>
                    <View className="flex-row items-center mt-1">
                      <Text className="text-white font-black text-lg">{monthly?.product.priceString || "€7.99"}</Text>
                      <Text className="ml-2 text-white/30 font-bold text-xs">/ month</Text>
                    </View>
                  </TouchableOpacity>
                </>
              )}
            </View>

            <Text className="text-center text-[10px] text-white/30 font-bold uppercase tracking-[1px] mb-20 px-8">
              {t.premiumDisclaimer}
            </Text>
          </ScrollView>
        </LinearGradient>
      </View>
    </Modal>
  );
}
