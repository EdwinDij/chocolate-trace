// src/pages/Alertes.tsx (Dashboard)
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../utils/supabase";
import {
  computeBatchesDates,
  getCurrentWeekLabel,
  getStatusStyle,
} from "../../utils/dates";
import Toast from "../../components/Toast";
import { useToast } from "../../hooks/useToast";
import { Batch } from "../../types/batch";

const PAGE_SIZE = 20;

export default function Alertes() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const { showToast } = useToast();
  useEffect(() => {
    fetchBatches(0);
  }, []);

  const fetchBatches = async (pageIndex: number) => {
    setLoading(true);
    const from = pageIndex * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    const { data, error } = await supabase
      .from("batches")
      .select("*, chocolate_type!type_id(name, week_lifetime)")
      .in("status", ["stock", "ouvert"])
      .order("created_at", { ascending: true })
      .range(from, to);
    if (!error) {
      setBatches((prev) => (pageIndex === 0 ? data || [] : [...prev, ...(data || [])]));
      setHasMore((data?.length ?? 0) === PAGE_SIZE);
      setPage(pageIndex);
    }
    setLoading(false);
  };

  // Calcul unique des dates par lot — évite de recalculer 3× pour expired/warning/ok
  const batchesWithDates = useMemo(
    () =>
      batches.map((b) => ({
        batch: b,
        dates: computeBatchesDates(b.week_receiving, b.chocolate_type.week_lifetime),
      })),
    [batches],
  );

  const expired = useMemo(
    () => batchesWithDates.filter(({ dates }) => dates?.status === "expired").map(({ batch }) => batch),
    [batchesWithDates],
  );

  const warning = useMemo(
    () => batchesWithDates.filter(({ dates }) => dates?.status === "warning").map(({ batch }) => batch),
    [batchesWithDates],
  );

  const ok = useMemo(
    () => batchesWithDates.filter(({ dates }) => dates?.status === "ok").map(({ batch }) => batch),
    [batchesWithDates],
  );

  const deleteBatch = async (id: string) => {
    const { error } = await supabase.from("batches").delete().eq("id", id);
    if (!error) {
      showToast("Lot supprimé avec succès.", "success");
      fetchBatches();
    }
  };
  // Composant de carte purement informatif (Style mini-badge)
  const DashboardCard = ({
    batch,
    isCritical,
    onDelete,
  }: {
    batch: Batch;
    isCritical: boolean;
    onDelete?: (id: string) => void;
  }) => {
    const dates = computeBatchesDates(
      batch.week_receiving,
      batch.chocolate_type.week_lifetime,
    );
    if (!dates) return null;

    return (
      <div
        className={`bg-white rounded-2xl p-4 shadow-[0_2px_8px_-3px_rgba(62,39,35,0.04)] border transition-all ${
          isCritical
            ? "border-red-200 bg-gradient-to-r from-red-50/30 to-white"
            : "border-amber-900/10"
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-bold text-[#3E2723] text-sm truncate">
              {batch.chocolate_type.name}
            </h3>
            <p className="text-[11px] font-medium text-stone-400 mt-0.5">
              RÉF: {batch.reference} ·{" "}
              <span className="text-amber-900/70 font-semibold">
                {batch.quantity} boîtes
              </span>
            </p>
          </div>


          <span
            className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${isCritical ? "bg-red-500 animate-pulse" : "bg-amber-500"}`}
          />
        </div>

        <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-stone-100/70 text-[11px] font-medium text-stone-500">
          <span className="bg-[#FAF7F2] px-2 py-0.5 rounded border border-stone-200/40 text-stone-600">
            Réception Sem. {batch.week_receiving}
          </span>
          {isCritical ? (
            <span className="text-red-600 font-bold">
              ⚠️ Retrait obligatoire ({dates.withdrawalDate})
            </span>
          ) : (
            <span className="text-amber-800 font-semibold">
              🕐 Alerte dans {dates.weeksUntilWithdrawal} sem.
            </span>
          )}
        </div>
        {isCritical && onDelete && (
          <button
            onClick={() => onDelete(batch.id)}
            className="mt-3 w-full bg-red-50 text-red-500 border border-red-200 py-1.5 rounded-xl text-xs font-semibold hover:bg-red-100 transition-colors"
          >
            🗑 Supprimer ce lot
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] pb-24 font-sans antialiased">
      {/* Header Statique du Tableau de bord */}
      <header className="bg-[#3E2723] text-white px-4 pt-8 pb-6 sticky top-0 z-10 shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black tracking-tight text-[#FFF8E1]">
              Vue d'Ensemble
            </h1>
            <p className="text-amber-200/60 text-xs mt-0.5 font-medium">
              État global de la fraîcheur en boutique
            </p>
          </div>
          <span className="text-[10px] bg-amber-700 text-[#FFF8E1] border border-amber-600 font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
            Sem. {getCurrentWeekLabel()}
          </span>
        </div>
      </header>

      {/* Les KPI (Indicateurs clés de performance) */}
      <div className="px-4 mt-5 grid grid-cols-3 gap-3">
        <div className="bg-white border border-amber-900/10 rounded-2xl p-3.5 shadow-sm flex flex-col justify-between min-h-[85px]">
          <p className="text-[10px] uppercase font-bold text-red-500/80 tracking-wider">
            À retirer
          </p>
          <p className="text-3xl font-black text-red-600 mt-1 leading-none">
            {expired.length}
          </p>
        </div>
        <div className="bg-white border border-amber-900/10 rounded-2xl p-3.5 shadow-sm flex flex-col justify-between min-h-[85px]">
          <p className="text-[10px] uppercase font-bold text-amber-600 tracking-wider">
            À surveiller
          </p>
          <p className="text-3xl font-black text-amber-500 mt-1 leading-none">
            {warning.length}
          </p>
        </div>
        <div className="bg-white border border-amber-900/10 rounded-2xl p-3.5 shadow-sm flex flex-col justify-between min-h-[85px]">
          <p className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">
            En sécurité
          </p>
          <p className="text-3xl font-black text-green-600 mt-1 leading-none">
            {ok.length}
          </p>
        </div>
      </div>

      {/* Listes des Anomalies prioritaires */}
      <div className="px-4 mt-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center pt-12 gap-2">
            <div className="w-5 h-5 border-2 border-amber-900/20 border-t-amber-900 rounded-full animate-spin" />
            <p className="text-center text-amber-900/40 text-xs font-medium">
              Calcul des stocks...
            </p>
          </div>
        ) : expired.length === 0 && warning.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-amber-900/10 shadow-sm px-6">
            <span className="text-2xl">✨</span>
            <p className="text-sm font-bold text-[#3E2723] mt-2">
              Tout est parfait !
            </p>
            <p className="text-xs text-stone-400 mt-1">
              Aucun lot ne nécessite d'action immédiate aujourd'hui.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {/* Groupe des urgences absolues */}
            {expired.length > 0 && (
              <div>
                <h2 className="text-[11px] font-bold text-red-600 uppercase tracking-wider mb-2 px-1 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
                  Urgences critiques ({expired.length})
                </h2>
                <div className="flex flex-col gap-2">
                  {expired.map((b) => (
                    <DashboardCard
                      key={b.id}
                      batch={b}
                      isCritical={true}
                      onDelete={deleteBatch}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Groupe des surveillances */}
            {warning.length > 0 && (
              <div>
                <h2 className="text-[11px] font-bold text-amber-700 uppercase tracking-wider mb-2 px-1 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  Vigilance court terme ({warning.length})
                </h2>
                <div className="flex flex-col gap-2">
                  {warning.map((b) => (
                    <DashboardCard key={b.id} batch={b} isCritical={false} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {hasMore && !loading && (
        <div className="px-4 mt-4 mb-8">
          <button
            onClick={() => fetchBatches(page + 1)}
            className="w-full py-3 rounded-xl text-xs font-bold text-amber-800 bg-white border border-amber-900/10 hover:bg-amber-50 transition-all"
          >
            Charger plus
          </button>
        </div>
      )}
    </div>
  );
}
