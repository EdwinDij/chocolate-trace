import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../utils/supabase";
import {
  computeBatchesDates,
  getCurrentWeekLabel,
  getStatusStyle,
} from "../../utils/dates";
import Toast from "../../components/Toast";
import { useToast } from "../../hooks/useToast";
import { ChocolateType } from "../management/Management";

interface Batch {
  id: string;
  reference: string;
  type_id: string;
  week_receiving: string;
  week_opening: string | null;
  quantity: number;
  status: string;
  created_at: string;
  chocolate_type: {
    name: string;
    week_lifetime: number;
  };
}

const FILTERS = [
  "Actifs",
  "En stock",
  "Ouverts",
  "Périmés",
  "À retirer",
] as const;
type Filter = (typeof FILTERS)[number];

export default function Suivi() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("Actifs");
  const [showForm, setShowForm] = useState(false);
  const { toast, showToast, hideToast } = useToast();
  const navigate = useNavigate();

  // Form state
  const [chocolate, setChocolate] = useState<ChocolateType[]>([]);
  const [typeId, setTypeId] = useState("");
  const [reference, setReference] = useState("");
  const [weekReceiving, setWeekReceiving] = useState(getCurrentWeekLabel());
  const [quantity, setQuantity] = useState("");

  useEffect(() => {
    fetchBatches();
    fetchChocolateTypes();
  }, []);

  const fetchBatches = async () => {
    const { data, error } = await supabase
      .from("batches")
      .select("*, chocolate_type!type_id(name, week_lifetime)")
      .order("created_at", { ascending: false });
    console.log("Batches fetched:", data);
    if (!error) setBatches(data || []);
    setLoading(false);
  };

  const fetchChocolateTypes = async () => {
    const { data, error } = await supabase
      .from("chocolate_type")
      .select("*")
      .order("name");
    // console.log("Chocolate types fetched:", data);
    if (!error) setChocolate(data || []);
  };

  const addBatch = async () => {
    if (!typeId || !reference.trim() || !weekReceiving || !quantity) return;
    const { error } = await supabase.from("batches").insert({
      type_id: typeId,
      reference: reference.trim(),
      week_receiving: weekReceiving,
      week_opening: null,
      quantity: parseInt(quantity),
      status: "stock",
    });
    if (!error) {
      showToast("Lot ajouté !");
      setTypeId("");
      setReference("");
      setWeekReceiving(getCurrentWeekLabel());
      setQuantity("");
      setShowForm(false);
      fetchBatches();
    } else {
      showToast("Erreur lors de l'ajout.", "error");
    }
  };

  const openBatch = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const { error } = await supabase
      .from("batches")
      .update({ week_opening: getCurrentWeekLabel(), status: "ouvert" })
      .eq("id", id);
    if (!error) {
      showToast("Boîte marquée comme ouverte !");
      fetchBatches();
    }
  };

  const updateStatus = async (
    id: string,
    status: string,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();

    if (status === "epuise") {
      const { error } = await supabase.from("batches").delete().eq("id", id);
      if (!error) {
        showToast("Lot épuisé et supprimé !");
        fetchBatches();
      }
      return;
    }

    const { error } = await supabase
      .from("batches")
      .update({ status })
      .eq("id", id);
    if (!error) {
      showToast("Boîte marquée comme périmée !");
      fetchBatches();
    }
  };

  const deleteBatch = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const { error } = await supabase.from("batches").delete().eq("id", id);
    if (!error) {
      showToast("Lot supprimé.");
      fetchBatches();
    }
  };

  const filteredBatches = batches.filter((b) => {
    if (filter === "Actifs")
      return b.status === "stock" || b.status === "ouvert";
    if (filter === "En stock") return b.status === "stock";
    if (filter === "Ouverts") return b.status === "ouvert";
    if (filter === "Périmés") return b.status === "perime";
    if (filter === "À retirer") {
      if (!b.week_opening) return false;
      const dates = computeBatchesDates(
        b.week_receiving ,
        b.chocolate_type.week_lifetime,
      );
      return dates?.status === "expired" || dates?.status === "warning";
    }
    return true;
  });

  const getStatusInfo = (batch: Batch) => {
    if (batch.status === "stock" || !batch.week_opening)
      return getStatusStyle("stock");
    if (batch.status === "perime") return getStatusStyle("perime");

    const dates = computeBatchesDates(
      batch.week_receiving ,
      batch.chocolate_type.week_lifetime,
    );
    if (!dates) return getStatusStyle("stock");

    return getStatusStyle(dates.status);
  };
  return (
    <div className="min-h-screen bg-stone-50 pb-24">
      <div className="bg-amber-800 text-white px-4 pt-10 pb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold">Suivi</h1>
          <p className="text-amber-200 text-sm mt-1">
            {getCurrentWeekLabel()} — Traçabilité chocolats
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="w-10 h-10 bg-amber-600 rounded-full flex items-center justify-center text-white text-xl shadow-md"
        >
          {showForm ? "✕" : "+"}
        </button>
      </div>

      {/* Formulaire ajout lot */}
      {showForm && (
        <div className="mx-4 mt-4 bg-white rounded-xl p-4 shadow-sm border border-stone-200">
          <h2 className="font-semibold text-stone-700 mb-3 text-sm">
            Nouveau lot
          </h2>
          <div className="mb-3">
            <label className="text-xs text-stone-500 mb-1 block">
              Type de chocolat
            </label>
            <select
              value={typeId}
              onChange={(e) => setTypeId(e.target.value)}
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-amber-600"
            >
              <option value="">Choisir...</option>
              {chocolate.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-3">
            <label className="text-xs text-stone-500 mb-1 block">
              Référence boîte
            </label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="ex. BOX-2025-042"
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-600"
            />
          </div>
          <div className="mb-3">
            <label className="text-xs text-stone-500 mb-1 block">
              Semaine de réception
            </label>
            <input
              type="text"
              value={weekReceiving}
              onChange={(e) => setWeekReceiving(e.target.value)}
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-600"
            />
          </div>
          <div className="mb-4">
            <label className="text-xs text-stone-500 mb-1 block">
              Quantité (boîtes)
            </label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="ex. 5"
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-600"
            />
          </div>
          <button
            onClick={addBatch}
            className="w-full bg-amber-800 text-white py-2.5 rounded-xl text-sm font-medium"
          >
            Enregistrer
          </button>
        </div>
      )}

      {/* Filtres */}
      <div className="px-4 mt-4 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors
              ${
                filter === f
                  ? "bg-amber-800 text-white"
                  : "bg-white text-stone-500 border border-stone-200"
              }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Liste des lots */}
      <div className="px-4 mt-4 flex flex-col gap-3">
        {loading ? (
          <p className="text-center text-stone-400 text-sm mt-8">
            Chargement...
          </p>
        ) : filteredBatches.length === 0 ? (
          <p className="text-center text-stone-400 text-sm mt-8">
            Aucun lot dans cette catégorie.
          </p>
        ) : (
          filteredBatches.map((batch) => {
            const statusInfo = getStatusInfo(batch);
            const dates = batch.week_receiving
              ? computeBatchesDates(
                  batch.week_receiving,
                  batch.chocolate_type.week_lifetime,
                )
              : null;

            return (
              <div
                key={batch.id}
                className="bg-white rounded-xl px-4 py-3 shadow-sm border border-stone-200 cursor-pointer active:scale-[0.98] transition-transform"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-stone-800 truncate">
                      {batch.chocolate_type.name}
                    </p>
                    <p className="text-xs text-stone-400 mt-0.5">
                      numéro de lot: {batch.reference} · {batch.quantity} boites
                    </p>
                  </div>
                  <span
                    className={`flex-shrink-0 text-xs font-medium px-2.5 py-1 rounded-full ${statusInfo.bg} ${statusInfo.text}`}
                  >
                    {statusInfo.label}
                  </span>
                </div>

                <div className="flex items-center gap-3 mt-2 text-xs text-stone-400">
                  <span>📦 Reçu {batch.week_receiving}</span>
                  {batch.week_opening && (
                    <span>🔓 Ouvert {batch.week_opening}</span>
                  )}
                  {dates && <span>📅 Retrait {dates.withdrawalDate}</span>}
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-3">
                  {batch.status !== "perime" && batch.status !== "epuise" && (
                    <div className="flex gap-2 mt-3">
                      {batch.status === "stock" && (
                        <button
                          onClick={(e) => openBatch(batch.id, e)}
                          className="flex-1 bg-amber-50 text-amber-700 border border-amber-200 py-1.5 rounded-lg text-xs font-medium"
                        >
                          🔓 Marquer ouvert
                        </button>
                      )}
                      <button
                        onClick={(e) => updateStatus(batch.id, "perime", e)}
                        className="flex-1 bg-red-50 text-red-400 border border-red-200 py-1.5 rounded-lg text-xs font-medium"
                      >
                        🗑 Périmé
                      </button>
                      <button
                        onClick={(e) => updateStatus(batch.id, "epuise", e)}
                        className="flex-1 bg-stone-50 text-stone-400 border border-stone-200 py-1.5 rounded-lg text-xs font-medium"
                      >
                        📦 Épuisé
                      </button>
                    </div>
                  )}

                  {batch.status === "perime" && (
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={(e) => deleteBatch(batch.id, e)}
                        className="flex-1 bg-red-50 text-red-500 border border-red-200 py-1.5 rounded-lg text-xs font-medium"
                      >
                        🗑 Supprimer définitivement
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}
    </div>
  );
}
