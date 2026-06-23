import { useNavigate } from "react-router-dom";
import { usePlanGate, PLAN_LIMITS, Plan } from "../hooks/usePlanGate";

interface UpgradeGateProps {
  requiredPlan: Exclude<Plan, "gratuit">;
  feature: string;
  children: React.ReactNode;
}

export default function UpgradeGate({ requiredPlan, feature, children }: UpgradeGateProps) {
  const navigate = useNavigate();
  const { hasPlan } = usePlanGate();

  if (hasPlan(requiredPlan)) return <>{children}</>;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-5 flex flex-col items-center text-center gap-3">
      <span className="text-2xl">🔒</span>
      <div>
        <p className="font-bold text-[#3E2723] text-sm">{feature}</p>
        <p className="text-xs text-slate-400 mt-1 font-medium">
          Disponible à partir du plan{" "}
          <span className="font-bold text-teal-700">
            {PLAN_LIMITS[requiredPlan].label}
          </span>
        </p>
      </div>
      <button
        onClick={() => navigate("/tarifs")}
        className="bg-ink-800 text-foam-100 px-5 py-2.5 rounded-xl text-sm font-bold active:scale-95 transition-all"
      >
        Voir les plans
      </button>
    </div>
  );
}
