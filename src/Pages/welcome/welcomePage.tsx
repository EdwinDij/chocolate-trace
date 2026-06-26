import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../utils/supabase";
import { useShop } from "../../context/ShopContext";
import { Check, ChevronRight, Package, Box, Users, X } from "lucide-react";

interface Step {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: string;
  path?: string;
  optional?: boolean;
}

export default function Welcome() {
  const { shop, user, refreshShop } = useShop();
  const navigate = useNavigate();
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>(
    {},
  );
  const [loading, setLoading] = useState(false);

  const displayName = user?.user_metadata?.display_name as string | undefined;
  const firstName = displayName?.split(" ")[0] ?? "là";

  const steps: Step[] = [
    {
      id: "product",
      icon: <Package size={20} className="text-teal-600" />,
      title: "Ajoutez votre premier produit",
      description:
        "Créez un produit dans votre catalogue avec sa durée de vie.",
      action: "Aller au catalogue",
      path: `/boutique/${shop?.id}/catalogue`,
    },
    {
      id: "batch",
      icon: <Box size={20} className="text-teal-600" />,
      title: "Enregistrez votre premier lot",
      description: "Tracez un lot reçu pour commencer le suivi des DLC.",
      action: "Aller au suivi",
      path: `/boutique/${shop?.id}`,
    },
    {
      id: "team",
      icon: <Users size={20} className="text-teal-600" />,
      title: "Invitez votre équipe",
      description: "Partagez l'accès avec vos responsables et employés.",
      action: "Gérer l'équipe",
      path: `/boutique/${shop?.id}/equipe`,
      optional: true,
    },
  ];

  // Vérifie automatiquement les étapes complétées
  useEffect(() => {
    if (!shop) return;
    checkSteps();
  }, [shop]);

  const checkSteps = async () => {
    if (!shop) return;

    const [
      { count: productCount },
      { count: batchCount },
      { count: memberCount },
    ] = await Promise.all([
      supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("shop_id", shop.id),
      supabase
        .from("batches")
        .select("*", { count: "exact", head: true })
        .eq("shop_id", shop.id),
      supabase
        .from("shop_member")
        .select("*", { count: "exact", head: true })
        .eq("shop_id", shop.id)
        .neq("role", "gerant"),
    ]);

    setCompletedSteps({
      product: (productCount ?? 0) > 0,
      batch: (batchCount ?? 0) > 0,
      team: (memberCount ?? 0) > 0,
    });
  };

  const completedCount = Object.values(completedSteps).filter(Boolean).length;
  const progress = Math.round((completedCount / steps.length) * 100);

  const handleComplete = async () => {
    if (!shop) return;
    setLoading(true);
    await supabase.from("shops").update({ onboarded: true }).eq("id", shop.id);
    await refreshShop();
    navigate(`/boutique/${shop.id}`);
  };

  const handleSkip = async () => {
    if (!shop) return;
    await supabase.from("shops").update({ onboarded: true }).eq("id", shop.id);
    await refreshShop();
    navigate(`/boutique/${shop.id}`);
  };
  const handleStepClick = (step: Step) => {
    if (step.path) navigate(step.path);
  };

  return (
    <div className="min-h-screen bg-app font-sans antialiased">
      {/* Header */}
      <div className="bg-ink-800 px-4 pt-12 pb-8">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-teal-300/60 text-xs font-bold uppercase tracking-widest mb-2">
              Bienvenue sur Tracéo 🎉
            </p>
            <h1 className="text-2xl font-black text-foam-100 tracking-tight">
              Bonjour {firstName} !
            </h1>
            <p className="text-teal-300/50 text-sm mt-1">
              {shop?.name} est prête. Configurons-la ensemble.
            </p>
          </div>
          <button
            onClick={handleSkip}
            className="flex items-center gap-1 text-teal-300/40 hover:text-teal-300/70 text-xs font-bold transition-colors mt-1"
          >
            <X size={14} />
            Passer
          </button>
        </div>

        {/* Barre de progression */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-teal-300/60">
              {completedCount}/{steps.length} étapes complétées
            </span>
            <span className="text-xs font-bold text-teal-300/60">
              {progress}%
            </span>
          </div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-teal-400 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Steps */}
      <div className="px-4 mt-5 flex flex-col gap-3">
        {steps.map((step, index) => {
          const isCompleted = completedSteps[step.id];
          return (
            <div
              key={step.id}
              className={`bg-card rounded-2xl border shadow-card transition-all ${
                isCompleted ? "border-teal-200" : "border-slate-200"
              }`}
            >
              <div className="p-4 flex items-start gap-3">
                {/* Numéro / Check */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                    isCompleted ? "bg-teal-500" : "bg-slate-100"
                  }`}
                >
                  {isCompleted ? (
                    <Check size={16} className="text-white" />
                  ) : (
                    <span className="text-xs font-black text-slate-400">
                      {index + 1}
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p
                      className={`font-bold text-sm ${isCompleted ? "text-teal-700 line-through opacity-60" : "text-slate-800"}`}
                    >
                      {step.title}
                    </p>
                    {step.optional && (
                      <span className="text-[9px] font-bold bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded-full uppercase">
                        Optionnel
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>

              {/* Action */}
              {!isCompleted && step.action && (
                <button
                  onClick={() => handleStepClick(step)}
                  className="w-full flex items-center justify-between px-4 py-3 border-t border-slate-100 hover:bg-slate-50 transition-colors active:scale-[0.99]"
                >
                  <span className="text-sm font-bold text-teal-600">
                    {step.action}
                  </span>
                  <ChevronRight size={15} className="text-teal-400" />
                </button>
              )}
            </div>
          );
        })}

        <button
          onClick={handleComplete}
          disabled={loading}
          className={`w-full py-4 rounded-2xl font-bold text-sm transition-all active:scale-95 mt-2 ${
            completedCount === steps.length
              ? "bg-teal-500 hover:bg-teal-600 text-white shadow-raised"
              : "bg-ink-800 hover:bg-ink-900 text-white"
          }`}
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
          ) : completedCount === steps.length ? (
            "🎉 Commencer à tracer mes lots !"
          ) : (
            "Terminer la configuration"
          )}
        </button>

        <p className="text-center text-xs text-slate-400 pb-8">
          Vous pouvez toujours revenir sur ces étapes plus tard.
        </p>
      </div>
    </div>
  );
}
