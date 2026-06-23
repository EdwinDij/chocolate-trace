import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { startCheckout, startPortal } from "../../utils/checkout";
import { usePlanGate } from "../../hooks/usePlanGate";
import { useShop } from "../../context/ShopContext";

const PLANS = [
  {
    key: "boutique" as const,
    name: "Boutique",
    price: 19,
    popular: false,
    features: [
      "1 établissement",
      "Lots & produits illimités",
      "Jauge de fraîcheur & alertes",
      "PWA mobile installable",
      "Comptes nominatifs & lien magique équipe",
    ],
    cta: "Choisir Boutique",
  },
  {
    key: "multi" as const,
    name: "Multi",
    price: 39,
    popular: true,
    features: [
      "Jusqu'à 5 établissements",
      "Tout ce qui est inclus dans Boutique",
      "Exports HACCP (PDF / CSV)",
      "Alertes e-mail hebdomadaires",
    ],
    cta: "Choisir Multi",
  },
];

export default function PricingPage() {
  const navigate = useNavigate();
  const { shop } = useShop();
  const { plan: currentPlan, isGratuit } = usePlanGate();
  const [loading, setLoading] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  const handleChoose = async (planKey: "boutique" | "multi") => {
    if (!shop) return;
    setLoading(planKey);
    const ok = await startCheckout(planKey, shop.id);
    if (!ok) setLoading(null);
  };

  const handlePortal = async () => {
    if (!shop) return;
    setPortalLoading(true);
    const ok = await startPortal(shop.id);
    if (!ok) setPortalLoading(false);
  };

  return (
    <div className="min-h-screen bg-app pb-36 font-sans antialiased">
      <header className="bg-ink-800 text-white px-4 pt-10 pb-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-widest text-foam-100/50 mb-4 active:opacity-70 transition-opacity"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2.5}
            stroke="currentColor"
            className="w-3.5 h-3.5"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
          Retour
        </button>
        <h1 className="text-2xl font-black tracking-tight text-foam-100">
          Choisissez votre plan
        </h1>
        <p className="text-teal-300/60 text-sm mt-1">
          Sans engagement · Résiliable à tout moment
        </p>
      </header>

      <div className="px-4 mt-6 flex flex-col gap-4">
        {PLANS.map((plan) => {
          const isActive = currentPlan === plan.key;
          const isLoading = loading === plan.key;

          return (
            <div
              key={plan.key}
              className={`rounded-3xl p-6 border transition-all ${
                plan.popular
                  ? "bg-ink-800 border-teal-700/30 shadow-xl"
                  : "bg-white border-slate-200 shadow-card"
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <p
                  className={`text-xs font-black uppercase tracking-widest ${
                    plan.popular ? "text-teal-400" : "text-slate-400"
                  }`}
                >
                  {plan.name}
                </p>
                {plan.popular && !isActive && (
                  <span className="bg-teal-500 text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full">
                    Populaire
                  </span>
                )}
                {isActive && (
                  <span className="bg-teal-100 text-teal-700 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full">
                    Plan actuel ✓
                  </span>
                )}
              </div>

              <div className="flex items-end gap-1 mb-5">
                <span
                  className={`text-5xl font-black tracking-tight ${
                    plan.popular ? "text-foam-100" : "text-[#3E2723]"
                  }`}
                >
                  {plan.price}€
                </span>
                <span
                  className={`text-sm font-medium mb-2 ${
                    plan.popular ? "text-foam-100/50" : "text-slate-400"
                  }`}
                >
                  /mois
                </span>
              </div>

              <ul className="flex flex-col gap-2.5 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className={`w-4 h-4 shrink-0 mt-0.5 ${
                        plan.popular ? "text-teal-400" : "text-teal-600"
                      }`}
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span
                      className={`text-sm font-medium leading-snug ${
                        plan.popular ? "text-foam-100/80" : "text-slate-600"
                      }`}
                    >
                      {f}
                    </span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => !isActive && handleChoose(plan.key)}
                disabled={isActive || !!loading}
                className={`w-full py-3.5 rounded-2xl font-bold text-sm tracking-wide transition-all active:scale-[0.98] disabled:opacity-60 ${
                  plan.popular
                    ? "bg-white text-ink-800 hover:bg-foam-100"
                    : "bg-ink-800 text-foam-100 hover:bg-ink-900"
                }`}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                    Redirection...
                  </span>
                ) : isActive ? (
                  "Plan actuel"
                ) : (
                  plan.cta
                )}
              </button>
            </div>
          );
        })}

        <p className="text-center text-[11px] text-slate-400 font-medium px-4">
          Paiement sécurisé par Stripe · Annulable à tout moment
        </p>

        {!isGratuit && (
          <button
            onClick={handlePortal}
            disabled={portalLoading}
            className="w-full py-3 rounded-2xl border border-slate-200 text-slate-500 text-sm font-medium hover:bg-slate-50 transition-all disabled:opacity-50"
          >
            {portalLoading ? "Redirection..." : "Gérer / annuler mon abonnement"}
          </button>
        )}
      </div>
    </div>
  );
}
