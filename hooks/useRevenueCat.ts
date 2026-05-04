import { useEffect, useState } from 'react';
import Purchases, { PurchasesPackage } from 'react-native-purchases';
import { useAppStore } from '../store/useAppStore';
import Constants from 'expo-constants';

const PRO_ENTITLEMENT_ID = 'pro_glowy';
// Expo Go non supporta il native SDK di RevenueCat → skip tutto
const IS_EXPO_GO = Constants.appOwnership === 'expo';

export const useRevenueCat = () => {
  const { setHasPremium } = useAppStore();
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);

  useEffect(() => {
    if (IS_EXPO_GO) return; // RevenueCat non configurato in Expo Go
    const fetchOfferings = async () => {
      try {
        const customerInfo = await Purchases.getCustomerInfo();
        const isPro = customerInfo.entitlements.active[PRO_ENTITLEMENT_ID] !== undefined;
        setHasPremium(isPro);

        const offerings = await Purchases.getOfferings();
        if (offerings.current !== null && offerings.current.availablePackages.length !== 0) {
          setPackages(offerings.current.availablePackages);
        } else {
          setPackages([]);
        }
      } catch (e) {
        console.error("RevenueCat Fetch Error:", e);
        setPackages([]);
      }
    };

    fetchOfferings();
  }, [setHasPremium]);

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
    } catch (e) {
      console.error("Restore error:", e);
      return false;
    }
  };

  const presentCodeRedemptionSheet = () => {
    if (typeof Purchases.presentCodeRedemptionSheet === 'function') {
      Purchases.presentCodeRedemptionSheet();
    }
  };

  return {
    packages,
    purchasePackage,
    restorePurchases,
    presentCodeRedemptionSheet,
  };
};
