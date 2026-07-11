import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { supabase } from "../../utils/supabase";
import { usePlanGate } from "../../hooks/usePlanGate";
import {
  computeBatchesDates,
  computeStatusFromDates,
  endOfWeekFromToday,
  formatDateFR,
  getCurrentWeekLabel,
} from "../../utils/dates";
import Toast from "../../components/Toast";
import { useToast } from "../../hooks/useToast";
import { Product } from "../../types/productType";
import BarcodeScanner from "../../components/barcodeScanner/BarcodeScanner";
import { archiveBatch } from "../../utils/historic";
import { Batch, BatchStatus } from "../../types/batch";
import { useShop } from "../../context/ShopContext";
import LotCard from "../../components/lotCard/LotCard";

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

  const [showCheckoutSuccess, setShowCheckoutSuccess] = useState(false);

  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { shop } = useShop();
  const { plan } = usePlanGate();
  const shopId = id ?? shop?.id;

  useEffect(() => {
    if (shopId) {
      fetchBatches(0);
      fetchProducts();
    }
  }, [shopId]);

  useEffect(() => {
    if (searchParams.get("checkout") === "success") {
      setShowCheckoutSuccess(true);
      setSearchParams({});
      const timer = setTimeout(() => setShowCheckoutSuccess(false), 5000);
      return () => clearTimeout(timer);
    }
  }, []);
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
      .order("created_at", { ascending: false })
      .range(from, to);
    if (!error) {
      setBatches((prev) =>
        pageIndex === 0 ? data || [] : [...prev, ...(data || [])],
      );
      setHasMore((data?.length ?? 0) === PAGE_SIZE);
      setPage(pageIndex);
    }
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
      differentWithdrawal && withdrawalDate
        ? withdrawalDate
        : expirationDate || null;
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
      withdrawal_date:
        finalWithdrawal !== expirationDate ? finalWithdrawal : null,
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

  const openBatch = async (id: string) => {
    const { error } = await supabase
      .from("batches")
      .update({
        week_opening: getCurrentWeekLabel(),
        status: BatchStatus.OUVERT,
        last_status: batches.find((b) => b.id === id)?.status ?? null,
      })
      .eq("id", id);

    if (error) {
      showToast("Erreur lors de l'ouverture du lot.", "error");
      return;
    }
    showToast("Boîte marquée comme ouverte !");
    fetchBatches(0);
  };

  const updateStatus = async (
    id: string,
    status: BatchStatus,
    reason?: string,
  ) => {
    const batch = batches.find((b) => b.id === id)!;
    if (!batch) {
      showToast("Lot introuvable, veuillez rafraîchir la page.", "error");
      fetchBatches(0);
      return;
    }

    if (status === BatchStatus.EPUISE) {
      const archiveError = await archiveBatch(batch, BatchStatus.EPUISE);
      if (archiveError) {
        showToast(`Erreur archivage : ${archiveError.message}`, "error");
        return;
      }
      await supabase.from("batches").delete().eq("id", id);
      showToast("Lot épuisé et archivé !");
      fetchBatches(0);
      return;
    }

    if (status === BatchStatus.NON_CONFORME) {
      const archiveError = await archiveBatch(
        batch,
        BatchStatus.NON_CONFORME,
        reason,
      );
      if (archiveError) {
        showToast(`Erreur archivage : ${archiveError.message}`, "error");
        return;
      }
    }

    if (status === BatchStatus.PERIME) {
      const archiveError = await archiveBatch(batch, BatchStatus.PERIME);
      if (archiveError) {
        showToast(`Erreur archivage : ${archiveError.message}`, "error");
        return;
      }
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

  const deleteBatch = async (id: string) => {
    const { error } = await supabase.from("batches").delete().eq("id", id);
    if (error) {
      showToast("Erreur lors de la suppression.", "error");
      return;
    }
    showToast("Lot supprimé.");
    fetchBatches(0);
  };

  // Dates pré-calculées une seule fois par lot
  const batchesWithDates = useMemo(
    () =>
      batches.map((b) => ({
        batch: b,
        dates:
          b.week_receiving && b.products.week_lifetime != null
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
      if (typeFilter && b.products.category !== typeFilter) return false;
      if (filter === "Actifs")
        return (
          b.status === BatchStatus.STOCK ||
          b.status === BatchStatus.OUVERT ||
          b.status === BatchStatus.EN_VENTE
        );
      if (filter === "En stock") return b.status === BatchStatus.STOCK;
      if (filter === "Ouverts") return b.status === BatchStatus.OUVERT;
      if (filter === "Périmés") return b.status === BatchStatus.PERIME;
      if (filter === "À retirer") {
        if (b.withdrawal_date || b.expiration_date) {
          const st = computeStatusFromDates(
            b.withdrawal_date,
            b.expiration_date,
          );
          return st === "expired" || st === "warning";
        }
        return dates?.status === "expired" || dates?.status === "warning";
      }
      return true;
    });
  }, [batchesWithDates, search, filter, typeFilter]);

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

    const { error: updateError } = await supabase
      .from("batches")
      .update({ status: batch.last_status, last_status: null })
      .eq("id", batch.id);

    if (updateError) {
      showToast("Erreur lors de l'annulation.", "error");
      return;
    }

    const { data, error: selectError } = await supabase
      .from("historic")
      .select("id")
      .eq("batch_id", batch.id)
      .order("created_at", { ascending: false })
      .limit(1);

    if (selectError) {
      showToast("Action annulée mais erreur sur l'historique.", "error");
      fetchBatches(0);
      return;
    }

    if (data?.[0]) {
      const { error: deleteError } = await supabase
        .from("historic")
        .delete()
        .eq("id", data[0].id);

      if (deleteError) {
        showToast("Action annulée mais erreur sur l'historique.", "error");
        fetchBatches(0);
        return;
      }
    }

    showToast("Action annulée !");
    fetchBatches(0);
  };

  return (
    <div className="min-h-screen bg-app pb-36 lg:pb-8 font-sans antialiased">
      {showCheckoutSuccess && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 px-6">
          <div className="bg-white rounded-3xl p-8 flex flex-col items-center text-center shadow-2xl max-w-xs w-full">
            <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-8 h-8 text-teal-600"
              >
                <path
                  fillRule="evenodd"
                  d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <h2 className="text-xl font-black text-slate-800 mb-1">
              Abonnement activé !
            </h2>
            <p className="text-sm text-slate-500 mb-1">
              Plan{" "}
              <span className="font-bold text-teal-600 capitalize">{plan}</span>{" "}
              actif sur {shop?.name}
            </p>
            <p className="text-xs text-slate-400 mb-6">
              Toutes les fonctionnalités sont débloquées.
            </p>
            <button
              onClick={() => setShowCheckoutSuccess(false)}
              className="w-full bg-ink-800 text-white font-bold py-3 rounded-2xl text-sm active:scale-95 transition-all"
            >
              Commencer
            </button>
          </div>
        </div>
      )}

      <header className="bg-ink-800 text-white px-4 pt-8 pb-6 sticky top-0 z-10 shadow-md">
        <div className="flex items-center justify-between">
          <div className="lg:hidden">
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
      <div className="mt-4 relative px-4 lg:max-w-2xl lg:mx-auto">
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
      <div className="px-4 lg:max-w-5xl lg:mx-auto lg:px-8">
        {/* Formulaire ajout lot style Carte Premium */}
        {showForm && (
          <div className="mt-4 bg-card rounded-2xl p-4 shadow-[0_4px_16px_-4px_rgba(62,39,35,0.08)] border border-slate-200 animate-fadeIn">
            <h2 className="font-bold mb-4 text-xs uppercase tracking-wider text-amber-900/60">
              Enregistrer un nouveau lot
            </h2>

            <div className="mb-3">
              <label className="text-[11px] uppercase font-bold text-amber-900/50 tracking-wider mb-1 block">
                Produit
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
                  Retrait{" "}
                  {Math.round(
                    (new Date(expirationDate).getTime() -
                      new Date(withdrawalDate).getTime()) /
                      86400000,
                  )}{" "}
                  j. avant la DLC
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
        <div className="mt-4 flex flex-col gap-3 lg:grid lg:grid-cols-2">
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
            filteredBatches.map(({ batch, dates }) => (
              <LotCard
                key={batch.id}
                batch={batch}
                dates={dates}
                onOpen={openBatch}
                onUpdateStatus={updateStatus}
                onDelete={deleteBatch}
                onUndo={undoLastAction}
              />
            ))
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
