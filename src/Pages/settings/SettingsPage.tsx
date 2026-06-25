import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useShop } from "../../context/ShopContext";
import { usePlanGate } from "../../hooks/usePlanGate";
import { startPortal } from "../../utils/checkout";
import { supabase } from "../../utils/supabase";
import {
  LogOut,
  User,
  CreditCard,
  Store,
  Trash2,
  ChevronRight,
  Crown,
} from "lucide-react";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const PLAN_STYLES: Record<string, { label: string; color: string }> = {
  gratuit: { label: "Gratuit", color: "bg-slate-100 text-slate-600" },
  boutique: { label: "Boutique", color: "bg-teal-100 text-teal-700" },
  multi: { label: "Multi", color: "bg-amber-100 text-amber-700" },
};

export default function SettingsPage() {
  const { user, shop, member, signOut } = useShop();
  const navigate = useNavigate();
  const { plan, isGratuit } = usePlanGate();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isGerant = member?.role === "gerant";
  const displayName = user?.user_metadata?.display_name as string | undefined;
  const planStyle = PLAN_STYLES[plan] ?? PLAN_STYLES.gratuit;

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    const { error } = await supabase.functions.invoke("delete-account");
    if (!error) {
      await signOut();
      navigate("/auth");
    }
    setDeleting(false);
  };

  const handlePortal = async () => {
    await startPortal(`${window.location.origin}/tarifs`);
  };

  return (
    <div className="min-h-screen bg-app pb-24 font-sans antialiased">
      {/* Header */}
      <header className="bg-ink-800 text-white px-4 pt-8 pb-6 sticky top-0 z-10 shadow-md">
        <h1 className="text-lg font-black tracking-tight text-foam-100">
          Mon Compte
        </h1>
        <p className="text-teal-300/60 text-xs mt-0.5 font-medium">
          Paramètres & abonnement
        </p>
      </header>

      <div className="px-4 mt-5 flex flex-col gap-4">
        {/* Profil */}
        <div className="bg-card rounded-2xl border border-slate-200 shadow-card overflow-hidden">
          <div className="px-4 pt-4 pb-4 flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-teal-700/10 border border-teal-200/60 flex items-center justify-center shrink-0">
              {displayName ? (
                <span className="text-sm font-black text-teal-700">
                  {getInitials(displayName)}
                </span>
              ) : (
                <User size={20} className="text-teal-600" />
              )}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-slate-800 text-sm">
                {displayName ?? "—"}
              </p>
              <p className="text-xs text-slate-400 truncate mt-0.5">
                {user?.email}
              </p>
            </div>
          </div>
        </div>

        {/* Boutique active */}
        {shop && (
          <div className="bg-card rounded-2xl border border-slate-200 shadow-card overflow-hidden">
            <div className="px-4 pt-3 pb-1">
              <p className="text-micro font-bold text-slate-400 uppercase tracking-wider">
                Boutique active
              </p>
            </div>
            <div className="px-4 pb-4 flex items-center gap-3">
              <div className="w-9 h-9 bg-teal-500/10 rounded-xl flex items-center justify-center shrink-0">
                <Store size={16} className="text-teal-600" />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-slate-800 text-sm truncate">
                  {shop.name}
                </p>
                <p className="text-xs text-slate-400 capitalize mt-0.5">
                  {shop.work}
                </p>
              </div>
              <span
                className={`ml-auto text-micro font-bold px-2.5 py-1 rounded-full shrink-0 ${planStyle.color}`}
              >
                {planStyle.label}
              </span>
            </div>
          </div>
        )}

        {/* Abonnement (gérant only) */}
        {isGerant && (
          <div className="bg-card rounded-2xl border border-slate-200 shadow-card overflow-hidden">
            <div className="px-4 pt-3 pb-1">
              <p className="text-micro font-bold text-slate-400 uppercase tracking-wider">
                Abonnement
              </p>
            </div>
            <button
              onClick={() => navigate("/tarifs")}
              className="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors border-t border-slate-100 active:scale-[0.99]"
            >
              <div className="w-9 h-9 bg-amber-500/10 rounded-xl flex items-center justify-center shrink-0">
                <Crown size={16} className="text-amber-600" />
              </div>
              <div className="text-left min-w-0">
                <p className="font-bold text-slate-800 text-sm">
                  {isGratuit
                    ? "Passer à la version payante"
                    : "Voir les offres"}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {isGratuit
                    ? "Boutique 19€/mois · Multi 39€/mois"
                    : `Plan ${planStyle.label} actif`}
                </p>
              </div>
              <ChevronRight
                size={15}
                className="text-slate-300 ml-auto shrink-0"
              />
            </button>
            {!isGratuit && (
              <button
                onClick={handlePortal}
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors border-t border-slate-100 active:scale-[0.99]"
              >
                <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center shrink-0">
                  <CreditCard size={16} className="text-slate-500" />
                </div>
                <div className="text-left min-w-0">
                  <p className="font-bold text-slate-700 text-sm">
                    Facturation & résiliation
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Portail Stripe sécurisé
                  </p>
                </div>
                <ChevronRight
                  size={15}
                  className="text-slate-300 ml-auto shrink-0"
                />
              </button>
            )}
          </div>
        )}

        {/* Déconnexion */}
        <button
          onClick={handleSignOut}
          className="w-full bg-card border border-slate-200 shadow-card rounded-2xl px-4 py-4 flex items-center gap-3 hover:bg-slate-50 transition-colors active:scale-[0.99]"
        >
          <div className="w-9 h-9 bg-ink-800/5 rounded-xl flex items-center justify-center shrink-0">
            <LogOut size={16} className="text-ink-800" />
          </div>
          <span className="font-bold text-slate-800 text-sm">
            Se déconnecter
          </span>
          <ChevronRight size={15} className="text-slate-300 ml-auto shrink-0" />
        </button>

        {/* Zone danger */}
        <div className="pb-2 flex justify-center">
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="text-xs text-slate-400 hover:text-red-500 transition-colors font-medium underline underline-offset-2"
          >
            Supprimer mon compte
          </button>
        </div>
      </div>

      {/* Modale confirmation suppression */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            className="bg-white w-full max-w-sm rounded-3xl p-6 flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mx-auto">
              <Trash2 size={22} className="text-red-600" />
            </div>
            <div className="text-center">
              <h2 className="text-lg font-black text-slate-800">
                Supprimer mon compte ?
              </h2>
              <p className="text-sm text-slate-500 leading-relaxed mt-2">
                Cette action est <strong>irréversible</strong>. Toutes vos
                boutiques, lots et données seront supprimés. Si vous avez un
                abonnement actif, il sera automatiquement résilié.
              </p>
            </div>
            <button
              onClick={handleDeleteAccount}
              disabled={deleting}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 rounded-2xl text-sm transition-all active:scale-95 disabled:opacity-50"
            >
              {deleting
                ? "Suppression en cours..."
                : "Oui, supprimer définitivement"}
            </button>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="w-full text-slate-500 font-bold py-2.5 text-sm hover:text-slate-700 transition-colors"
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
