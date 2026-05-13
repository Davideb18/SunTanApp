import { useCallback, useEffect, useState, useRef } from 'react';
import Purchases, { PurchasesPackage } from 'react-native-purchases';
import { useAppStore } from '../store/useAppStore';
import Constants from 'expo-constants';

const PRO_ENTITLEMENT_ID = 'pro_glowy';
// Expo Go non supporta il native SDK di RevenueCat → skip tutto
const IS_EXPO_GO = Constants.appOwnership === 'expo';

export const useRevenueCat = () => {
  const { setHasPremium } = useAppStore();
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [isLoadingOfferings, setIsLoadingOfferings] = useState(false);
  const retryCountRef = useRef(0);
  const MAX_RETRIES = 5;

  const refreshOfferings = useCallback(async () => {
    if (IS_EXPO_GO) return;
    setIsLoadingOfferings(true);
    try {
      console.log("[RevenueCat] Fetching offerings...");
      const customerInfo = await Purchases.getCustomerInfo();
      const isPro = customerInfo.entitlements.active[PRO_ENTITLEMENT_ID] !== undefined;
      setHasPremium(isPro);

      const offerings = await Purchases.getOfferings();
      if (offerings.current !== null && offerings.current.availablePackages.length !== 0) {
        console.log(`[RevenueCat] ✅ Loaded ${offerings.current.availablePackages.length} packages`);
        setPackages(offerings.current.availablePackages);
      } else {
        console.warn("[RevenueCat] No offerings available");
        setPackages([]);
      }
      // Reset retry count on success
      retryCountRef.current = 0;
    } catch (e: any) {
      // Se Purchases non è ancora configurato, retry con limite
      if (e.message && e.message.includes("no singleton instance") && retryCountRef.current < MAX_RETRIES) {
        retryCountRef.current += 1;
        console.warn(`[RevenueCat] Not yet initialized (retry ${retryCountRef.current}/${MAX_RETRIES}), retrying in 1000ms...`);
        setTimeout(() => {
          refreshOfferings();
        }, 1000);
      } else {
        console.error("RevenueCat Fetch Error:", e);
        setPackages([]);
      }
    } finally {
      setIsLoadingOfferings(false);
    }
  }, [setHasPremium]);

  useEffect(() => {
    if (IS_EXPO_GO) return; // RevenueCat non configurato in Expo Go
    
    // Aumenta il delay per dare tempo a _layout.tsx di completare Purchases.configure()
    // RevenueCat init è async e richiede più tempo su device reali (soprattutto in preview build)
    const timer = setTimeout(() => {
      refreshOfferings();
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [refreshOfferings]);

  const purchasePackage = async (pack: PurchasesPackage) => {
    if (IS_EXPO_GO) {
      console.log('[RevenueCat] Purchase skipped in Expo Go. Use a Dev Build to test payments.');
      return false;
    }
    try {
      const { customerInfo } = await Purchases.purchasePackage(pack);
      const isPro = customerInfo.entitlements.active[PRO_ENTITLEMENT_ID] !== undefined;
      setHasPremium(isPro);
      return isPro;
    } catch (e: any) {
      if (!e.userCancelled) {
        console.error("Purchase error:", e);
        throw e; // Rethrow to let the UI show an alert
      }
      return false;
    }
  };

  const restorePurchases = async () => {
    if (IS_EXPO_GO) {
      console.log('[RevenueCat] Restore skipped in Expo Go.');
      return false;
    }
    try {
      const customerInfo = await Purchases.restorePurchases();
      const isPro = customerInfo.entitlements.active[PRO_ENTITLEMENT_ID] !== undefined;
      setHasPremium(isPro);
      return isPro;
    } catch (e: any) {
      console.error("Restore error:", e);
      throw e; // Rethrow to let the UI show an alert
    }
  };

  const presentCodeRedemptionSheet = () => {
    if (typeof Purchases.presentCodeRedemptionSheet === 'function') {
      Purchases.presentCodeRedemptionSheet();
    }
  };

  return {
    packages,
    isLoadingOfferings,
    refreshOfferings,
    purchasePackage,
    restorePurchases,
    presentCodeRedemptionSheet,
  };
};
