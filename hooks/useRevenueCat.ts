import { useEffect, useState } from 'react';
import Purchases, { PurchasesPackage } from 'react-native-purchases';
import { useAppStore } from '../store/useAppStore';

const PRO_ENTITLEMENT_ID = 'pro_features';

export const useRevenueCat = () => {
  const { setHasPremium } = useAppStore();
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);

  useEffect(() => {
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

  return {
    packages,
    purchasePackage,
    restorePurchases,
  };
};
