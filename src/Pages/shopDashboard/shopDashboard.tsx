import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../utils/supabase";
import { useShop } from "../../context/ShopContext";
import { usePlanGate } from "../../hooks/usePlanGate";
import { Plus, Store, ChevronRight, Users, Package, AlertTriangle, LogOut } from "lucide-react";

interface ShopSummary {
  id: string;
  name: string;
  work: string;
  plan: string;
  stats: {
    total: number;
    alerts: number;
    members: number;
  };
}

const WORKS = [
  "Crémerie", "Charcuterie", "Traiteur", "Boulangerie",
  "Pâtisserie", "Conserverie", "Chocolaterie", "Poissonnerie", "Autre",
];

export default function Dashboard() {
  const { user, shop, shops, switchShop, signOut, member } = useShop();
  const navigate = useNavigate();
  const { canAddShop } = usePlanGate();
  const isGerant = member?.role === "gerant";
  const [summaries, setSummaries] = useState<ShopSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newShopName, setNewShopName] = useState("");
  const [newShopWork, setNewShopWork] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (shops.length > 0) loadSummaries();
  }, [shops]);

  const loadSummaries = async () => {
    const results = await Promise.all(
      shops.map(async (s) => {
        const [{ count: total }, { count: alerts }, { count: members }] =
          await Promise.all([
            supabase
              .from("batches")
              .select("*", { count: "exact", head: true })
              .eq("shop_id", s.id)
              .in("status", ["stock", "ouvert"]),
            supabase
              .from("batches")
              .select("*", { count: "exact", head: true })
              .eq("shop_id", s.id)
              .eq("status", "perime"),
            supabase
              .from("shop_member")
              .select("*", { count: "exact", head: true })
              .eq("shop_id", s.id),
          ]);
        return {
          ...s,
          stats: { total: total || 0, alerts: alerts || 0, members: members || 0 },
        };
      })
    );
    setSummaries(results);
    setLoading(false);
  };

  const addShop = async () => {
    if (!newShopName.trim() || !newShopWork || !user) return;
    setAdding(true);
    const { data: shopData, error } = await supabase
      .from("shops")
      .insert({ name: newShopName.trim(), work: newShopWork, plan: "gratuit", owner_id: user.id })
      .select()
      .single();
    if (!error && shopData) {
      await supabase.from("shop_member").insert({
        user_id: user.id,
        shop_id: shopData.id,
        role: "gerant",
      });
      setNewShopName("");
      setNewShopWork("");
      setShowAddForm(false);
      window.location.reload();
    }
    setAdding(false);
  };

 const handleSwitch = (shopId: string) => {
  switchShop(shopId);
  navigate(`/boutique/${shopId}`);
};

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

  return (
    <div className="min-h-screen bg-app pb-24 font-sans antialiased">

      {/* Header */}
      <header className="bg-ink-800 text-white px-4 pt-8 pb-6 sticky top-0 z-10 shadow-md">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-lg font-black tracking-tight text-foam-100">
              Mes Boutiques
            </h1>
            <p className="text-teal-300/60 text-xs mt-0.5 font-medium">
              {shops.length} établissement{shops.length > 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSignOut}
              className="w-9 h-9 bg-ink-900 hover:bg-ink-700 rounded-full flex items-center justify-center transition-colors active:scale-95"
              title="Se déconnecter"
            >
              <LogOut size={15} className="text-teal-300/70" />
            </button>
            {isGerant && (
              <button
                onClick={() => canAddShop ? setShowAddForm(!showAddForm) : navigate("/tarifs")}
                className="w-9 h-9 bg-teal-600 hover:bg-teal-500 rounded-full flex items-center justify-center transition-colors active:scale-95"
                title={canAddShop ? "Ajouter une boutique" : "Limite atteinte — voir les plans"}
              >
                <Plus size={18} className="text-white" />
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="px-4 mt-5 flex flex-col gap-4">

        {/* Formulaire ajout boutique */}
        {showAddForm && (
          <div className="bg-card rounded-2xl p-4 border border-slate-200 shadow-card">
            <h2 className="text-micro font-bold text-slate-400 uppercase tracking-wider mb-4">
              Nouvelle boutique
            </h2>
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-micro font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">
                  Nom de l'établissement
                </label>
                <input
                  type="text"
                  value={newShopName}
                  onChange={(e) => setNewShopName(e.target.value)}
                  placeholder="ex. Ma Fromagerie Opéra"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-500 bg-sunk text-slate-800 placeholder-slate-300"
                />
              </div>
              <div>
                <label className="text-micro font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">
                  Métier
                </label>
                <select
                  value={newShopWork}
                  onChange={(e) => setNewShopWork(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-500 bg-sunk text-slate-800 appearance-none"
                >
                  <option value="">Sélectionner...</option>
                  {WORKS.map((w) => (
                    <option key={w} value={w.toLowerCase()}>{w}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={addShop}
                disabled={adding || !newShopName.trim() || !newShopWork}
                className="w-full bg-ink-800 hover:bg-ink-900 text-white font-bold py-3 rounded-xl text-sm transition-all disabled:opacity-40 active:scale-95"
              >
                {adding ? "Création..." : "Créer la boutique"}
              </button>
            </div>
          </div>
        )}

        {/* Liste des boutiques */}
        {loading ? (
          <div className="flex justify-center pt-12">
            <div className="w-5 h-5 border-2 border-ink-800/20 border-t-ink-800 rounded-full animate-spin" />
          </div>
        ) : (
          summaries.map((s) => {
            const isActive = shop?.id === s.id;
            return (
              <div
                key={s.id}
                className={`bg-card rounded-2xl border overflow-hidden transition-all ${
                  isActive
                    ? "border-teal-500/40 shadow-raised"
                    : "border-slate-200 shadow-card"
                }`}
              >
                {/* Header carte */}
                <div className="px-4 pt-4 pb-3 flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      isActive ? "bg-teal-500" : "bg-slate-100"
                    }`}>
                      <Store size={16} className={isActive ? "text-white" : "text-slate-400"} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-800 text-sm truncate">{s.name}</p>
                      <p className="text-xs text-slate-400 capitalize mt-0.5">{s.work}</p>
                    </div>
                  </div>
                  {isActive && (
                    <span className="text-micro font-bold bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full shrink-0">
                      Active
                    </span>
                  )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 border-t border-slate-100 divide-x divide-slate-100">
                  <div className="flex flex-col items-center py-3 gap-0.5">
                    <Package size={13} className="text-slate-400" />
                    <p className="text-2xl font-black text-slate-800">{s.stats.total}</p>
                    <p className="text-micro text-slate-400 uppercase font-bold tracking-wider">Lots</p>
                  </div>
                  <div className="flex flex-col items-center py-3 gap-0.5">
                    <AlertTriangle size={13} className={s.stats.alerts > 0 ? "text-red-400" : "text-slate-400"} />
                    <p className={`text-2xl font-black ${s.stats.alerts > 0 ? "text-red-600" : "text-slate-800"}`}>
                      {s.stats.alerts}
                    </p>
                    <p className="text-micro text-slate-400 uppercase font-bold tracking-wider">Alertes</p>
                  </div>
                  <div className="flex flex-col items-center py-3 gap-0.5">
                    <Users size={13} className="text-slate-400" />
                    <p className="text-2xl font-black text-slate-800">{s.stats.members}</p>
                    <p className="text-micro text-slate-400 uppercase font-bold tracking-wider">Membres</p>
                  </div>
                </div>

                {/* Action switch */}
                {!isActive && (
                  <div className="px-4 pb-4 pt-2">
                    <button
                      onClick={() => handleSwitch(s.id)}
                      className="w-full bg-sunk hover:bg-slate-100 text-slate-700 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 border border-slate-200"
                    >
                      Passer sur cette boutique
                      <ChevronRight size={13} />
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
        {/* Zone danger */}
        <div className="mt-6 border-t border-slate-100 pt-5">
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-5"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            className="bg-white w-full max-w-sm rounded-3xl p-6 flex flex-col gap-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mx-auto">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-red-600">
                <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="text-center">
              <h2 className="text-lg font-black text-slate-800 mb-1">Supprimer mon compte ?</h2>
              <p className="text-sm text-slate-500 leading-relaxed">
                Action <strong className="text-red-600">irréversible</strong>. Toutes vos boutiques, lots et données seront supprimés. Votre abonnement Stripe sera automatiquement résilié.
              </p>
            </div>
            <button
              onClick={handleDeleteAccount}
              disabled={deleting}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 rounded-2xl text-sm transition-all active:scale-95 disabled:opacity-50"
            >
              {deleting ? "Suppression en cours..." : "Supprimer définitivement"}
            </button>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3.5 rounded-2xl text-sm transition-all active:scale-95"
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  );
}