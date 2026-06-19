import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../../utils/supabase";
import {
  computeBatchesDates,
  computeStatusFromDates,
  endOfWeekFromToday,
  formatDateFR,
  getCurrentWeekLabel,
  getStatusStyle,
} from "../../utils/dates";
import Toast from "../../components/Toast";
import { useToast } from "../../hooks/useToast";
import { Product } from "../../types/productType";
import BarcodeScanner from "../../components/barcodeScanner/BarcodeScanner";
import { archiveBatch } from "../../utils/historic";
import { Batch, BatchStatus } from "../../types/batch";
import { useShop } from "../../context/ShopContext";

const FILTERS = [
  "Actifs",
  "En stock",
  "Ouverts",
  "Périmés",
  "À retirer",
] as const;
type Filter = (typeof FILTERS)[number];

const PAGE_SIZE = 20;

export default function Suivi() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filter, setFilter] = useState<Filter>("Actifs");
  const [showForm, setShowForm] = useState(false);
  const { toast, showToast, hideToast } = useToast();
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  // Form state
  const [typeId, setTypeId] = useState("");
  const [reference, setReference] = useState("");
  const [weekReceiving, setWeekReceiving] = useState(getCurrentWeekLabel());
  const [quantity, setQuantity] = useState("");
  const [expirationDate, setExpirationDate] = useState("");
  const [withdrawalDate, setWithdrawalDate] = useState("");
  const [differentWithdrawal, setDifferentWithdrawal] = useState(false);
  const [search, setSearch] = useState("");
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);

  const { id } = useParams<{ id: string }>();
  const { shop } = useShop();
  const shopId = id ?? shop?.id;

  useEffect(() => {
    if (shopId) {
      fetchBatches(0);
      fetchProducts();
    }
  }, [shopId]);

  useEffect(() => {
    const product = products.find((p) => p.id === typeId);
    if (product?.week_lifetime) {
      const dlc = endOfWeekFromToday(product.week_lifetime);
      setExpirationDate(dlc);
      setWithdrawalDate(dlc);
    } else {
      setExpirationDate("");
      setWithdrawalDate("");
    }
    setDifferentWithdrawal(false);
  }, [typeId, products]);

  const fetchBatches = async (pageIndex: number) => {
    if (pageIndex === 0) setLoading(true);
    else setLoadingMore(true);
    const from = pageIndex * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    if (!shopId) return;
    const { data, error } = await supabase
      .from("batches")
      .select("*, products!product_id(name, week_lifetime, category)")
      .eq("shop_id", shopId)
      .order("created_at", { ascending: false });
    if (!error) {
      setBatches((prev) =>
        pageIndex === 0 ? data || [] : [...prev, ...(data || [])],
      );
      setHasMore((data?.length ?? 0) === PAGE_SIZE);
      setPage(pageIndex);
    }
    setLoading(false);
    if (pageIndex === 0) setLoading(false);
    else setLoadingMore(false);
  };

  const fetchProducts = async () => {
    if (!shopId) return;
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("shop_id", shopId)
      .order("name");
    if (!error) setProducts(data || []);
  };

  const addBatch = async () => {
    if (!typeId || !reference.trim() || !weekReceiving || !quantity || !shopId)
      return;
    const finalWithdrawal =
      differentWithdrawal && withdrawalDate ? withdrawalDate : expirationDate || null;
    const { error } = await supabase.from("batches").insert({
      product_id: typeId,
      shop_id: shopId,
      reference: reference.trim(),
      week_receiving: weekReceiving,
      week_opening: null,
      quantity: parseInt(quantity),
      last_status: null,
      status: BatchStatus.STOCK,
      expiration_date: expirationDate || null,
      withdrawal_date: finalWithdrawal !== expirationDate ? finalWithdrawal : null,
    });
    if (!error) {
      showToast("Lot ajouté avec succès !");
      setTypeId("");
      setReference("");
      setWeekReceiving(getCurrentWeekLabel());
      setQuantity("");
      setExpirationDate("");
      setWithdrawalDate("");
      setDifferentWithdrawal(false);
      setShowForm(false);
      fetchBatches(0);
    } else {
      showToast("Erreur lors de l'ajout.", "error");
    }
  };

  const openBatch = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const { error } = await supabase
      .from("batches")
      .update({
        week_opening: getCurrentWeekLabel(),
        status: BatchStatus.OUVERT,
        last_status: batches.find((b) => b.id === id)?.status ?? null,
      })
      .eq("id", id);
    if (!error) {
      showToast("Boîte marquée comme ouverte !");
      fetchBatches(0);
    }
  };

  const updateStatus = async (
    id: string,
    status: string,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();
    const batch = batches.find((b) => b.id === id)!;
    const previousStatus = batch.status;

    if (status === BatchStatus.EPUISE) {
      const confirmEpuise = window.confirm(
        "Confirmez-vous que ce lot est épuisé ?",
      );
      if (!confirmEpuise) return;
      await archiveBatch(batch, BatchStatus.EPUISE);
      await supabase.from("batches").delete().eq("id", id);
      showToast("Lot épuisé et archivé !");
      fetchBatches(0);
      return;
    }

    if (status === BatchStatus.NON_CONFORME) {
      const reason = window.prompt(
        "Raison de non-conformité (ex: moisissure, choc thermique...)",
      );
      if (reason === null) return; // annulé
      const error = await archiveBatch(
        batch,
        BatchStatus.NON_CONFORME,
        reason || undefined,
      );
      // console.log("archiveBatch error:", error);
      // console.log("batch envoyé:", batch);
    }

    if (status === BatchStatus.PERIME) {
      await archiveBatch(batch, BatchStatus.PERIME);
    }

    const { error } = await supabase
      .from("batches")
      .update({ status, last_status: batch.status })
      .eq("id", id);
    if (!error) {
      showToast(
        status === BatchStatus.PERIME
          ? "Lot marqué périmé."
          : status === BatchStatus.NON_CONFORME
            ? "Lot marqué non conforme."
            : "",
      );
      fetchBatches(0);
    }
  };

  const deleteBatch = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const confirm = window.confirm("Supprimer définitivement ce lot ?");
    if (!confirm) return;
    await supabase.from("batches").delete().eq("id", id);
    showToast("Lot supprimé.");
    fetchBatches(0);
  };

  // Dates pré-calculées une seule fois par lot
  const batchesWithDates = useMemo(
    () =>
      batches.map((b) => ({
        batch: b,
        dates: b.week_receiving
          ? computeBatchesDates(b.week_receiving, b.products.week_lifetime)
          : null,
      })),
    [batches],
  );

  const filteredBatches = useMemo(() => {
    const q = search.trim().toLowerCase();
    return batchesWithDates.filter(({ batch: b, dates }) => {
      if (
        q &&
        !b.reference.toLowerCase().includes(q) &&
        !b.products.name.toLowerCase().includes(q)
      )
        return false;
      if (typeFilter && b.products.type !== typeFilter) return false;
      if (filter === "Actifs")
        return (
          b.status === BatchStatus.STOCK || b.status === BatchStatus.OUVERT
        );
      if (filter === "En stock") return b.status === BatchStatus.STOCK;
      if (filter === "Ouverts") return b.status === BatchStatus.OUVERT;
      if (filter === "Périmés") return b.status === BatchStatus.PERIME;
      if (filter === "À retirer") {
        if (b.withdrawal_date || b.expiration_date) {
          const st = computeStatusFromDates(b.withdrawal_date, b.expiration_date);
          return st === "expired" || st === "warning";
        }
        return dates?.status === "expired" || dates?.status === "warning";
      }
      return true;
    });
  }, [batchesWithDates, search, filter, typeFilter]);

  const getStatusInfo = (
    batch: Batch,
    dates: ReturnType<typeof computeBatchesDates>,
  ) => {
    if (batch.status === BatchStatus.STOCK || !batch.week_opening)
      return getStatusStyle(BatchStatus.STOCK);
    if (batch.status === BatchStatus.PERIME)
      return getStatusStyle(BatchStatus.PERIME);
    if (batch.status === BatchStatus.NON_CONFORME)
      return getStatusStyle(BatchStatus.NON_CONFORME);
    if (batch.withdrawal_date || batch.expiration_date)
      return getStatusStyle(
        computeStatusFromDates(batch.withdrawal_date, batch.expiration_date),
      );
    if (!dates) return getStatusStyle(BatchStatus.STOCK);
    return getStatusStyle(dates.status);
  };
  const handleBarcodeScan = async (barcode: string) => {
    setShowBarcodeScanner(false);

    const { data, error } = await supabase
      .from("products")
      .select("id, name, week_lifetime")
      .eq("barcode", barcode)
      .single();

    if (error || !data) {
      showToast(
        "Code-barres non reconnu — sélectionne le type de chocolat manuellement.",
        "error",
      );
      setShowForm(true);
      return;
    }

    showToast(`${data.name} reconnu !`);
    setTypeId(data.id);
    setShowForm(true);
  };

  const undoLastAction = async (batch: Batch) => {
    if (!batch.last_status) return;

    await supabase
      .from("batches")
      .update({ status: batch.last_status, last_status: null })
      .eq("id", batch.id);

    // Supprime la dernière entrée historic liée
    const { data } = await supabase
      .from("historic")
      .select("id")
      .eq("batch_id", batch.id)
      .order("created_at", { ascending: false })
      .limit(1);
    if (data?.[0]) {
      await supabase.from("historic").delete().eq("id", data[0].id);
    }

    showToast("Action annulée !");
    fetchBatches(0);
  };
  return (
    <div className="min-h-screen bg-app pb-24 font-sans antialiased">
      <header className="bg-ink-800 text-white px-4 pt-8 pb-6 sticky top-0 z-10 shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black tracking-tight text-foam-100">
              Suivi des Lots
            </h1>
            <p className="text-teal-300/60 text-xs mt-0.5 font-medium">
              {shop?.name} — Sem. {getCurrentWeekLabel()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowBarcodeScanner(true)}
              className="w-10 h-10 bg-ink-800 rounded-full flex items-center justify-center shadow-md border border-teal-500 hover:bg-ink-800 active:scale-95 transition-all duration-200"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-5 h-5 text-foam-100"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 3.75 9.375v-4.5ZM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5ZM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 13.5 9.375v-4.5Z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6.75 6.75h.75v.75h-.75v-.75ZM6.75 16.5h.75v.75h-.75v-.75ZM16.5 6.75h.75v.75h-.75v-.75ZM13.5 13.5h.75v.75h-.75v-.75ZM13.5 18.75h.75v.75h-.75v-.75ZM18.75 13.5h.75v.75h-.75v-.75ZM18.75 18.75h.75v.75h-.75v-.75ZM16.5 16.5h.75v.75h-.75v-.75Z"
                />
              </svg>
            </button>
            <button
              onClick={() => setShowForm(!showForm)}
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shadow-md border transition-all duration-200 active:scale-95 ${
                showForm
                  ? "bg-card text-stone-700 border-stone-200"
                  : "bg-ink-800 text-foam-100 border-teal-500 hover:bg-ink-800"
              }`}
            >
              {showForm ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18 18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 4.5v15m7.5-7.5h-15"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>
      {/* Searchbar */}
      <div className="mt-4 relative px-4">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
          />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher par nom ou référence..."
          className="w-full pl-9 pr-4 py-2.5 bg-card border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-stone-400 focus:outline-none focus:border-teal-500 shadow-sm"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-stone-600"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-4 h-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18 18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>
      <div className="px-4">
        {/* Formulaire ajout lot style Carte Premium */}
        {showForm && (
          <div className="mt-4 bg-card rounded-2xl p-4 shadow-[0_4px_16px_-4px_rgba(62,39,35,0.08)] border border-slate-200 animate-fadeIn">
            <h2 className="font-bold mb-4 text-xs uppercase tracking-wider text-amber-900/60">
              Enregistrer un nouveau lot
            </h2>

            <div className="mb-3">
              <label className="text-[11px] uppercase font-bold text-amber-900/50 tracking-wider mb-1 block">
                Type de chocolat
              </label>
              <select
                value={typeId}
                onChange={(e) => setTypeId(e.target.value)}
                className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm font-medium focus:outline-none focus:border-teal-500 bg-sunk text-slate-800 transition-all appearance-none shadow-inner"
                style={{
                  backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%2378716c' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'></polyline></svg>")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 12px center",
                  backgroundSize: "16px",
                }}
              >
                <option value="">Sélectionner une référence...</option>
                {products.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-3">
              <label className="text-[11px] uppercase font-bold text-amber-900/50 tracking-wider mb-1 block">
                Référence boîte
              </label>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="ex. BOX-2026-042"
                className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm font-medium focus:outline-none focus:border-teal-500 bg-sunk placeholder-stone-400 shadow-inner"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="text-[11px] uppercase font-bold text-amber-900/50 tracking-wider mb-1 block">
                  Semaine réception
                </label>
                <input
                  type="text"
                  value={weekReceiving}
                  onChange={(e) => setWeekReceiving(e.target.value)}
                  className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm font-semibold focus:outline-none focus:border-teal-500 bg-sunk shadow-inner"
                />
              </div>
              <div>
                <label className="text-[11px] uppercase font-bold text-amber-900/50 tracking-wider mb-1 block">
                  Quantité (boîtes)
                </label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="ex. 5"
                  className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm font-medium focus:outline-none focus:border-teal-500 bg-sunk placeholder-stone-400 shadow-inner"
                />
              </div>
            </div>

            {/* DLC */}
            <div className="mb-3">
              <label className="text-[11px] uppercase font-bold text-amber-900/50 tracking-wider mb-1 block">
                Date de péremption (DLC)
              </label>
              <input
                type="date"
                value={expirationDate}
                onChange={(e) => {
                  setExpirationDate(e.target.value);
                  if (!differentWithdrawal) setWithdrawalDate(e.target.value);
                }}
                className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm font-medium focus:outline-none focus:border-teal-500 bg-sunk shadow-inner text-slate-700"
              />
            </div>

            {/* Retrait différent de la DLC */}
            <div className="mb-4">
              <label className="flex items-center gap-2 cursor-pointer mb-2">
                <input
                  type="checkbox"
                  checked={differentWithdrawal}
                  onChange={(e) => {
                    setDifferentWithdrawal(e.target.checked);
                    if (!e.target.checked) setWithdrawalDate(expirationDate);
                  }}
                  className="w-4 h-4 accent-ink-800"
                />
                <span className="text-xs font-semibold text-slate-600">
                  Date de retrait différente de la DLC
                </span>
              </label>
              {differentWithdrawal && (
                <input
                  type="date"
                  value={withdrawalDate}
                  max={expirationDate || undefined}
                  onChange={(e) => setWithdrawalDate(e.target.value)}
                  className="w-full border border-amber-200 rounded-xl px-3 py-2.5 text-sm font-medium focus:outline-none focus:border-amber-500 bg-amber-50 shadow-inner text-slate-700"
                />
              )}
              {!differentWithdrawal && expirationDate && (
                <p className="text-xs text-slate-400 font-medium">
                  Retrait = DLC ({formatDateFR(expirationDate)})
                </p>
              )}
              {differentWithdrawal && withdrawalDate && expirationDate && (
                <p className="text-xs text-amber-600 font-medium mt-1">
                  Retrait {Math.round((new Date(expirationDate).getTime() - new Date(withdrawalDate).getTime()) / 86400000)} j. avant la DLC
                </p>
              )}
            </div>

            <button
              onClick={addBatch}
              disabled={!typeId || !reference.trim() || !quantity}
              className="w-full bg-ink-800 text-foam-100 hover:bg-ink-800 disabled:opacity-40 disabled:hover:bg-ink-800 py-3 rounded-xl text-sm font-bold tracking-wide transition-all duration-150 shadow-sm active:scale-95"
            >
              Ajouter au stock
            </button>
          </div>
        )}

        {/* Pilules de Filtres Horizontaux */}
        <div className="mt-5 flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200 tracking-wide border
                ${
                  filter === f
                    ? "bg-ink-800 text-foam-100 border-amber-900/20 shadow-sm"
                    : "bg-card text-slate-500 border-stone-200/80 hover:text-stone-700 hover:bg-sunk"
                }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Filtres par type */}
        {products.some((p) => p.category) && (
          <div className="mt-2 flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4">
            {[
              null,
              ...new Set(products.map((p) => p.category).filter(Boolean)),
            ].map((t) => (
              <button
                key={t ?? "tous"}
                onClick={() => setTypeFilter(t)}
                className={`shrink-0 px-3 py-1 rounded-full text-xs font-semibold transition-all duration-200 border
          ${
            typeFilter === t
              ? "bg-ink-800 text-foam-100 border-[#3E2723]"
              : "bg-card text-slate-400 border-stone-200/80 hover:text-stone-600"
          }`}
              >
                {t ?? "Tous"}
              </button>
            ))}
          </div>
        )}

        {/* Liste principale des lots */}
        <div className="mt-4 flex flex-col gap-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center pt-12 gap-2">
              <div className="w-5 h-5 border-2 border-amber-900/20 border-t-amber-900 rounded-full animate-spin" />
              <p className="text-center text-amber-900/40 text-xs font-medium">
                Inventaire en cours...
              </p>
            </div>
          ) : filteredBatches.length === 0 ? (
            <p className="text-center text-amber-900/40 text-sm py-8 bg-card rounded-2xl border border-slate-200 shadow-sm font-medium">
              Aucun lot trouvé dans cette catégorie.
            </p>
          ) : (
            filteredBatches.map(({ batch, dates }) => {
              const statusInfo = getStatusInfo(batch, dates);

              return (
                <div
                  key={batch.id}
                  className="bg-card rounded-2xl p-4 shadow-[0_2px_8px_-3px_rgba(62,39,35,0.04)] border border-slate-200 hover:border-amber-700/20 transition-all"
                >
                  {/* Titre et badge de statut */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-bold text-[#3E2723] text-[15px] tracking-tight leading-tight">
                        {batch.products.name}
                      </p>
                      <p className="text-xs text-slate-400 mt-1 font-medium">
                        Réf :{" "}
                        <span className="font-semibold text-stone-600">
                          {batch.reference}
                        </span>{" "}
                        ·{" "}
                        <span className="text-teal-700 font-semibold">
                          {batch.quantity} boîte{batch.quantity > 1 ? "s" : ""}
                        </span>
                      </p>
                    </div>
                    <span
                      className={`shrink-0 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${statusInfo.bg} ${statusInfo.text} border-current/10`}
                    >
                      {statusInfo.label}
                    </span>
                  </div>

                  {/* Ligne des dates de traçabilité */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3 pt-3 border-t border-stone-100 text-xs text-slate-500 font-medium">
                    <span className="flex items-center gap-1">
                      <span className="text-stone-300">📦</span> Reçu{" "}
                      <strong className="text-stone-700">
                        {batch.week_receiving}
                      </strong>
                    </span>
                    {batch.week_opening && (
                      <span className="flex items-center gap-1">
                        <span className="text-stone-300">🔓</span> Ouvert{" "}
                        <strong className="text-stone-700">
                          {batch.week_opening}
                        </strong>
                      </span>
                    )}
                    {batch.expiration_date && (
                      <span className="flex items-center gap-1">
                        <span className="text-stone-300">⏱</span> DLC :{" "}
                        <strong className="text-stone-700">
                          {formatDateFR(batch.expiration_date)}
                        </strong>
                      </span>
                    )}
                    {/* Retrait = withdrawal_date si différent de DLC, sinon = DLC */}
                    {(batch.withdrawal_date || batch.expiration_date) && (
                      <span className="flex items-center gap-1 ml-auto text-amber-900/80">
                        <span className="text-amber-700/40">📅</span> Retrait :{" "}
                        <strong className="font-bold text-amber-900">
                          {formatDateFR(batch.withdrawal_date ?? batch.expiration_date!)}
                        </strong>
                      </span>
                    )}
                    {/* Fallback pour les anciens lots sans dates stockées */}
                    {!batch.expiration_date && !batch.withdrawal_date && dates && (
                      <span className="flex items-center gap-1 ml-auto text-amber-900/80">
                        <span className="text-amber-700/40">📅</span> Retrait :{" "}
                        <strong className="font-bold text-amber-900">
                          {dates.withdrawalDate}
                        </strong>
                      </span>
                    )}
                  </div>

                  <div className="mt-4 flex gap-2">
                    {batch.status !== BatchStatus.PERIME &&
                      batch.status !== BatchStatus.EPUISE && (
                        <>
                          {batch.status === BatchStatus.STOCK && (
                            <button
                              onClick={(e) => openBatch(batch.id, e)}
                              className="flex-1 bg-teal-50 text-teal-700 border border-amber-200/60 hover:bg-amber-100/70 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-95"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={2}
                                stroke="currentColor"
                                className="w-3.5 h-3.5"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M13.5 10.5V6.75a4.5 4.5 0 1 1 9 0v3.75M3.75 21.75h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H3.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
                                />
                              </svg>
                              Ouvrir
                            </button>
                          )}
                          <button
                            onClick={(e) =>
                              updateStatus(batch.id, BatchStatus.PERIME, e)
                            }
                            className="flex-1 bg-red-50/60 text-red-600 border border-red-100 hover:bg-red-50 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-95"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={2}
                              stroke="currentColor"
                              className="w-3.5 h-3.5"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
                              />
                            </svg>
                            Périmé
                          </button>
                          <button
                            onClick={(e) =>
                              updateStatus(
                                batch.id,
                                BatchStatus.NON_CONFORME,
                                e,
                              )
                            }
                            className="flex-1 bg-purple-50 text-purple-600 border border-purple-100 hover:bg-purple-100 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-95"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={2}
                              stroke="currentColor"
                              className="w-3.5 h-3.5"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                              />
                            </svg>
                            Non conforme
                          </button>
                          <button
                            onClick={(e) =>
                              updateStatus(batch.id, BatchStatus.EPUISE, e)
                            }
                            className="flex-1 bg-sunk text-stone-600 border border-stone-200/80 hover:bg-stone-100 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-95"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={2}
                              stroke="currentColor"
                              className="w-3.5 h-3.5"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z"
                              />
                            </svg>
                            Épuisé
                          </button>
                        </>
                      )}

                    {batch.status === BatchStatus.PERIME && (
                      <button
                        onClick={(e) => deleteBatch(batch.id, e)}
                        className="flex-1 bg-red-600 text-white hover:bg-red-700 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-95"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                          stroke="currentColor"
                          className="w-3.5 h-3.5"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                          />
                        </svg>
                        Supprimer définitivement du registre
                      </button>
                    )}
                    {batch.last_status && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          undoLastAction(batch);
                        }}
                        className="flex-1 bg-stone-100 text-stone-600 border border-stone-200 hover:bg-stone-200 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-95"
                      >
                        Annuler - remettre en "{batch.last_status}"
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {hasMore && (
          <button
            onClick={() => fetchBatches(page + 1)}
            disabled={loadingMore}
            className="w-full mt-3 py-3 rounded-xl text-xs font-bold text-teal-700 bg-card border border-slate-200 hover:bg-teal-50 transition-all disabled:opacity-50"
          >
            {loadingMore ? "Chargement..." : "Charger plus"}
          </button>
        )}
      </div>
      {showBarcodeScanner && (
        <BarcodeScanner
          onScan={handleBarcodeScan}
          onClose={() => setShowBarcodeScanner(false)}
        />
      )}

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}
    </div>
  );
}
