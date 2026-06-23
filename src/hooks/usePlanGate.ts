import { useShop } from "../context/ShopContext";

export type Plan = "gratuit" | "boutique" | "multi";

export const PLAN_LIMITS: Record<Plan, {
  maxShops: number;
  emailAlerts: boolean;
  haccpExport: boolean;
  label: string;
}> = {
  gratuit: { maxShops: 1, emailAlerts: false, haccpExport: false, label: "Gratuit" },
  boutique: { maxShops: 1, emailAlerts: false, haccpExport: false, label: "Boutique" },
  multi: { maxShops: 5, emailAlerts: true, haccpExport: true, label: "Multi" },
};

const PLAN_RANK: Record<Plan, number> = { gratuit: 0, boutique: 1, multi: 2 };

export function usePlanGate() {
  const { shop, shops } = useShop();
  const plan = ((shop?.plan as Plan) ?? "gratuit");
  const limits = PLAN_LIMITS[plan] ?? PLAN_LIMITS.gratuit;

  return {
    plan,
    limits,
    canAddShop: shops.length < limits.maxShops,
    hasEmailAlerts: limits.emailAlerts,
    hasHaccpExport: limits.haccpExport,
    hasPlan: (required: Plan) => PLAN_RANK[plan] >= PLAN_RANK[required],
    isGratuit: plan === "gratuit",
    isBoutique: plan === "boutique",
    isMulti: plan === "multi",
  };
}
