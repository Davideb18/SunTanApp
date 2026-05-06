/**
 * hooks/usePremium.ts
 *
 * Hook che verifica se l'utente ha un abbonamento Premium attivo.
 * Usa RevenueCat come fonte di verità.
 *
 * Utilizzo:
 *   const { isPremium, isLoading } = usePremium();
 */

import { useState, useEffect } from "react";
import Purchases, { CustomerInfo } from "react-native-purchases";
import { Platform } from "react-native";
import Constants from "expo-constants";

// L'identificatore dell'Entitlement che abbiamo creato su RevenueCat
const ENTITLEMENT_ID = "pro_glowy";

interface PremiumState {
  isPremium: boolean;
  isLoading: boolean;
  customerInfo: CustomerInfo | null;
  refresh: () => Promise<void>;
}

export function usePremium(): PremiumState {
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);

  const checkPremiumStatus = async () => {
    // RevenueCat funziona solo su dispositivi fisici/simulatori iOS e Android e non su Expo Go
    const isExpoGo = Constants.appOwnership === "expo";
    if (Platform.OS === "web" || isExpoGo) {
      setIsLoading(false);
      return;
    }

    try {
      const info = await Purchases.getCustomerInfo();
      setCustomerInfo(info);

      // Controlliamo se l'entitlement "pro_glowy" è attivo
      const isActive =
        info.entitlements.active[ENTITLEMENT_ID] !== undefined;
      setIsPremium(isActive);
    } catch (error) {
      console.error("[usePremium] Errore nel recupero CustomerInfo:", error);
      setIsPremium(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkPremiumStatus();

    const isExpoGo = Constants.appOwnership === "expo";
    if (Platform.OS === "web" || isExpoGo) return;

    // Ascolta i cambiamenti in tempo reale (es. dopo un acquisto)
    const onCustomerInfoUpdated = (info: CustomerInfo) => {
      setCustomerInfo(info);
      const isActive =
        info.entitlements.active[ENTITLEMENT_ID] !== undefined;
      setIsPremium(isActive);
    };

    Purchases.addCustomerInfoUpdateListener(onCustomerInfoUpdated);

    return () => {
      Purchases.removeCustomerInfoUpdateListener(onCustomerInfoUpdated);
    };
  }, []);

  return {
    isPremium,
    isLoading,
    customerInfo,
    refresh: checkPremiumStatus,
  };
}
