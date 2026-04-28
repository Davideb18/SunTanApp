import AsyncStorage from "@react-native-async-storage/async-storage";

export type ReferralPlan = "weekly" | "quarterly" | "annual";
export type ReferralPaymentStatus = "paid" | "trial" | "canceled";

export interface ReferralActivation {
  id: string;
  referralCode: string;
  userName: string;
  createdAt: string;
  source: "ambassador-card";
}

export interface ReferralPayment {
  id: string;
  referralCode: string;
  purchaserId: string;
  plan: ReferralPlan;
  status: ReferralPaymentStatus;
  amountEur: number;
  createdAt: string;
}

interface ReferralTestDbShape {
  activations: ReferralActivation[];
  payments: ReferralPayment[];
}

export interface ReferralStats {
  activationsCount: number;
  paidCount: number;
  weeklyPaidCount: number;
  quarterlyPaidCount: number;
  annualPaidCount: number;
}

const STORAGE_KEY = "referral_test_db_v1";

const EMPTY_DB: ReferralTestDbShape = {
  activations: [],
  payments: [],
};

const PLAN_EUR: Record<ReferralPlan, number> = {
  weekly: 7,
  quarterly: 20,
  annual: 40,
};

const normalizeCode = (code: string) => code.trim().toUpperCase();

const makeId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

async function readDb(): Promise<ReferralTestDbShape> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return EMPTY_DB;

  try {
    const parsed = JSON.parse(raw) as ReferralTestDbShape;
    return {
      activations: parsed.activations || [],
      payments: parsed.payments || [],
    };
  } catch {
    return EMPTY_DB;
  }
}

async function writeDb(data: ReferralTestDbShape): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export async function activateReferralCode(params: {
  referralCode: string;
  userName: string;
}): Promise<ReferralActivation> {
  const db = await readDb();
  const referralCode = normalizeCode(params.referralCode);

  const activation: ReferralActivation = {
    id: makeId(),
    referralCode,
    userName: params.userName.trim(),
    createdAt: new Date().toISOString(),
    source: "ambassador-card",
  };

  db.activations.push(activation);
  await writeDb(db);
  return activation;
}

export async function addMockPaidSubscriber(params: {
  referralCode: string;
  plan: ReferralPlan;
  purchaserId?: string;
}): Promise<ReferralPayment> {
  const db = await readDb();
  const referralCode = normalizeCode(params.referralCode);

  const payment: ReferralPayment = {
    id: makeId(),
    referralCode,
    purchaserId: params.purchaserId || `mock-user-${Math.random().toString(36).slice(2, 7)}`,
    plan: params.plan,
    status: "paid",
    amountEur: PLAN_EUR[params.plan],
    createdAt: new Date().toISOString(),
  };

  db.payments.push(payment);
  await writeDb(db);
  return payment;
}

export async function getReferralStats(referralCode: string): Promise<ReferralStats> {
  const normalized = normalizeCode(referralCode);
  const db = await readDb();

  const codeActivations = db.activations.filter((entry) => entry.referralCode === normalized);
  const codePaid = db.payments.filter((entry) => entry.referralCode === normalized && entry.status === "paid");

  return {
    activationsCount: codeActivations.length,
    paidCount: codePaid.length,
    weeklyPaidCount: codePaid.filter((entry) => entry.plan === "weekly").length,
    quarterlyPaidCount: codePaid.filter((entry) => entry.plan === "quarterly").length,
    annualPaidCount: codePaid.filter((entry) => entry.plan === "annual").length,
  };
}

export async function registerRevenueCatPurchaseEvent(params: {
  referralCode: string;
  purchaserId: string;
  productId: string;
  isActive: boolean;
}): Promise<void> {
  if (!params.isActive) return;

  let plan: ReferralPlan | null = null;
  if (params.productId.includes("weekly")) plan = "weekly";
  if (params.productId.includes("quarterly")) plan = "quarterly";
  if (params.productId.includes("annual")) plan = "annual";

  if (!plan) return;

  await addMockPaidSubscriber({
    referralCode: params.referralCode,
    plan,
    purchaserId: params.purchaserId,
  });
}
