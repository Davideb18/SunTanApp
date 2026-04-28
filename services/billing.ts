export type SubscriptionPlan = "weekly" | "quarterly" | "annual";
export type BillingSource = "local-mock" | "revenuecat" | "supabase";

export interface EntitlementSnapshot {
  isPremium: boolean;
  source: BillingSource;
  productId?: string;
  plan?: SubscriptionPlan;
  customerId?: string;
  expiresAt?: string | null;
  updatedAt: string;
}

export const SUBSCRIPTION_PRODUCT_IDS = {
  weekly: "glowy_weekly",
  quarterly: "glowy_quarterly",
  annual: "glowy_annual",
} as const;

export const REVENUECAT_ENTITLEMENT_ID = "premium";

export function mapProductIdToPlan(productId: string): SubscriptionPlan | null {
  const normalized = productId.toLowerCase();

  if (normalized.includes("weekly")) return "weekly";
  if (normalized.includes("quarterly")) return "quarterly";
  if (normalized.includes("annual")) return "annual";

  return null;
}

export function planFromRevenueCatProductId(productId: string): SubscriptionPlan | null {
  return mapProductIdToPlan(productId);
}

export function buildEntitlementSnapshot(params: {
  isPremium: boolean;
  source: BillingSource;
  productId?: string;
  customerId?: string;
  expiresAt?: string | null;
}): EntitlementSnapshot {
  const plan = params.productId ? mapProductIdToPlan(params.productId) ?? undefined : undefined;

  return {
    isPremium: params.isPremium,
    source: params.source,
    productId: params.productId,
    plan,
    customerId: params.customerId,
    expiresAt: params.expiresAt ?? null,
    updatedAt: new Date().toISOString(),
  };
}

export function isKnownSubscriptionProduct(productId: string): boolean {
  return mapProductIdToPlan(productId) !== null;
}

export function getCommissionPercentage(plan: SubscriptionPlan): number {
  switch (plan) {
    case "weekly":
      return 0.5;
    case "quarterly":
      return 0.5;
    case "annual":
      return 0.5;
  }
}

export function calculateCommissionCents(amountCents: number, plan: SubscriptionPlan): number {
  return Math.round(amountCents * getCommissionPercentage(plan));
}

export function buildRevenueCatSyncPayload(params: {
  userId: string;
  customerId: string;
  productId: string;
  isPremium: boolean;
  expiresAt?: string | null;
}) {
  return {
    userId: params.userId,
    customerId: params.customerId,
    productId: params.productId,
    plan: mapProductIdToPlan(params.productId),
    isPremium: params.isPremium,
    expiresAt: params.expiresAt ?? null,
    entitlementId: REVENUECAT_ENTITLEMENT_ID,
    syncedAt: new Date().toISOString(),
  };
}

export function buildReferralPayoutRow(params: {
  ambassadorId: string;
  periodStart: string;
  periodEnd: string;
  totalConversions: number;
  totalAmountCents: number;
  plan: SubscriptionPlan;
}) {
  return {
    ambassadorId: params.ambassadorId,
    periodStart: params.periodStart,
    periodEnd: params.periodEnd,
    totalConversions: params.totalConversions,
    totalAmountCents: params.totalAmountCents,
    commissionCents: calculateCommissionCents(params.totalAmountCents, params.plan),
  };
}
