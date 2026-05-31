import { useEffect, useState } from "react";
import { supabase } from "../../utils/supabase";
import {
  computeBatchesDates,
  getCurrentWeekLabel,
  getStatusStyle,
} from "../../utils/dates";

interface Batch {
  id: string;
  reference: string;
  week_receiving: string;
  quantity: number;
  status: string;
  chocolate_type: {
    name: string;
    week_lifetime: number;
  };
}

export default function Alertes() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    const { data, error } = await supabase
      .from("batches")
      .select("*, chocolate_type!type_id(name, week_lifetime)")
      .in("status", ["stock", "ouvert"])
      .order("created_at", { ascending: true });
    if (!error) setBatches(data || []);
    setLoading(false);
  };

  // Fonction pour supprimer le lot
  const deleteBatch = async (id: string) => {
    const confirmDelete = window.confirm("Voulez-vous vraiment supprimer ce lot périmé ?");
    if (!confirmDelete) return;

    const { error } = await supabase
      .from("batches")
      .delete()
      .eq("id", id);

    if (!error) {
      // Met à jour l'état local pour faire disparaître le lot instantanément
      setBatches((prev) => prev.filter((b) => b.id !== id));
    } else {
      alert("Une erreur est survenue lors de la suppression.");
    }
  };

  const expired = batches.filter((b) => {
    const d = computeBatchesDates(
      b.week_receiving,
      b.chocolate_type.week_lifetime,
    );
    return d?.status === "expired";
  });

  const warning = batches.filter((b) => {
    const d = computeBatchesDates(
      b.week_receiving,
      b.chocolate_type.week_lifetime,
    );
    return d?.status === "warning";
  });

  const ok = batches.filter((b) => {
    const d = computeBatchesDates(
      b.week_receiving,
      b.chocolate_type.week_lifetime,
    );
    return d?.status === "ok";
  });

  const AlertCard = ({ batch }: { batch: Batch }) => {
    const dates = computeBatchesDates(
      batch.week_receiving,
      batch.chocolate_type.week_lifetime,
    );
    if (!dates) return null;
    const style = getStatusStyle(dates.status);

    return (
      <div className="bg-white rounded-xl px-4 py-3 shadow-sm border border-stone-200">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-semibold text-stone-800 truncate">
              {batch.chocolate_type.name}
            </p>
            <p className="text-xs text-stone-400 mt-0.5">
              {batch.reference} · {batch.quantity} boîtes
            </p>
          </div>
          <span
            className={`flex-shrink-0 text-xs font-medium px-2.5 py-1 rounded-full ${style.bg} ${style.text}`}
          >
            {style.label}
          </span>
        </div>
        <div className="flex items-center gap-3 mt-2 text-xs text-stone-400">
          <span>📦 Reçu {batch.week_receiving}</span>
          <span>📅 Retrait {dates.withdrawalDate}</span>
          <span>
            {dates.status === "expired"
              ? `⏳ Périmé depuis ${dates.expiryDate}`
              : `date de péremption: ${dates.expiryDate}`}
          </span>
        </div>
        
        {dates.status === "expired" && (
          <div className="mt-2 flex items-center justify-between gap-2 bg-red-50 rounded-lg p-1.5 pl-3">
            <span className="text-xs font-medium text-red-600📐">
              ⚠️ À retirer immédiatement de la vente
            </span>
            <button
              onClick={() => deleteBatch(batch.id)}
              className="flex items-center justify-center p-1.5 rounded-md bg-red-600 text-white hover:bg-red-700 active:scale-95 transition-all shadow-sm"
              title="Supprimer le lot"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
              </svg>
            </button>
          </div>
        )}

        {dates.status === "warning" && (
          <div className="mt-2 text-xs font-medium text-amber-600 bg-amber-50 rounded-lg px-3 py-1.5">
            🕐 Retrait dans {dates.weeksUntilWithdrawal} semaine
            {dates.weeksUntilWithdrawal > 1 ? "s" : ""}
          </div>
        )}
      </div>
    );
  };

  const Section = ({
    title,
    items,
    empty,
  }: {
    title: string;
    items: Batch[];
    empty: string;
  }) => (
    <div className="mb-6">
      <h2 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3 px-1">
        {title} ({items.length})
      </h2>
      {items.length === 0 ? (
        <p className="text-center text-stone-400 text-sm py-4 bg-white rounded-xl border border-stone-200">
          {empty}
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((b) => (
            <AlertCard key={b.id} batch={b} />
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-stone-50 pb-24">
      {/* Header */}
      <div className="bg-amber-800 text-white px-4 pt-10 pb-6">
        <h1 className="text-xl font-bold">Alertes</h1>
        <p className="text-amber-200 text-sm mt-1">
          {getCurrentWeekLabel()} — {expired.length + warning.length} lot
          {expired.length + warning.length > 1 ? "s" : ""} à surveiller
        </p>
      </div>

      {/* Compteurs */}
      <div className="px-4 mt-4 grid grid-cols-3 gap-3">
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-red-600">{expired.length}</p>
          <p className="text-xs text-red-400 mt-0.5">À retirer</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-amber-600">{warning.length}</p>
          <p className="text-xs text-amber-400 mt-0.5">À surveiller</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-green-600">{ok.length}</p>
          <p className="text-xs text-green-400 mt-0.5">OK</p>
        </div>
      </div>

      <div className="px-4 mt-6">
        {loading ? (
          <p className="text-center text-stone-400 text-sm mt-8">
            Chargement...
          </p>
        ) : (
          <>
            <Section
              title="🔴 À retirer immédiatement"
              items={expired}
              empty="Aucun lot à retirer"
            />
            <Section
              title="🟠 À surveiller"
              items={warning}
              empty="Aucun lot en alerte"
            />
            <Section
              title="🟢 En bonne forme"
              items={ok}
              empty="Aucun lot OK"
            />
          </>
        )}
      </div>
    </div>
  );
}