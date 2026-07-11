import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../../utils/supabase";
import { Batch, BatchStatus } from "../../types/batch";
import {
  computeBatchesDates,
  formatDate,
  getCurrentWeekLabel,
  getStatusStyle,
  parseWeekLabel,
} from "../../utils/dates";
import FreshnessMeter from "../../components/lotCard/FreshnessMeter";
import BottomSheet from "../../components/BottomSheet";

type SheetType = "perime" | "non_conforme" | "epuise" | "ouvrir" | "supprimer";

const SHEET_CONFIG: Record<
  SheetType,
  {
    title: string;
    description?: string;
    confirmLabel: string;
    confirmVariant: "danger" | "warning" | "default";
    withReason?: boolean;
    reasonPlaceholder?: string;
  }
> = {
  ouvrir: {
    title: "Ouvrir ce lot ?",
    description: "La semaine d'ouverture sera enregistrée.",
    confirmLabel: "Ouvrir",
    confirmVariant: "default",
  },
  perime: {
    title: "Marquer comme périmé ?",
    description: "Le lot sera archivé et retiré du stock actif.",
    confirmLabel: "Périmé",
    confirmVariant: "danger",
  },
  non_conforme: {
    title: "Non conforme ?",
    description: "Indiquez la raison de la non-conformité.",
    confirmLabel: "Confirmer",
    confirmVariant: "warning",
    withReason: true,
    reasonPlaceholder: "ex. moisissure, choc thermique...",
  },
  epuise: {
    title: "Lot épuisé ?",
    description: "Le lot sera archivé dans l'historique.",
    confirmLabel: "Épuisé",
    confirmVariant: "default",
  },
  supprimer: {
    title: "Supprimer définitivement ?",
    description: "Cette action est irréversible. Le lot sera effacé du registre.",
    confirmLabel: "Supprimer",
    confirmVariant: "danger",
  },
};

export default function LotDetail() {
  const { id: shopId, batchId } = useParams();
  const navigate = useNavigate();
  const [batch, setBatch] = useState<Batch | null>(null);
  const [loading, setLoading] = useState(true);
  const [sheet, setSheet] = useState<SheetType | null>(null);

  useEffect(() => {
    if (!batchId) return;
    supabase
      .from("batches")
      .select("*, products!product_id(name, week_lifetime, category)")
      .eq("id", batchId)
      .single()
      .then(({ data, error }) => {
        if (!error) setBatch(data);
        setLoading(false);
      });
  }, [batchId]);

  const handleMiseEnVente = async () => {
    if (!batch) return;
    await supabase
      .from("batches")
      .update({ status: BatchStatus.EN_VENTE, last_status: batch.status })
      .eq("id", batch.id);
    navigate(-1);
  };

  const handleConfirm = async (reason?: string) => {
    if (!sheet || !batch) return;

    if (sheet === "ouvrir") {
      await supabase
        .from("batches")
        .update({
          week_opening: getCurrentWeekLabel(),
          status: BatchStatus.OUVERT,
          last_status: batch.status,
        })
        .eq("id", batch.id);
    } else if (sheet === "supprimer") {
      await supabase.from("batches").delete().eq("id", batch.id);
    } else {
      const statusMap: Record<string, string> = {
        perime: BatchStatus.PERIME,
        non_conforme: BatchStatus.NON_CONFORME,
        epuise: BatchStatus.EPUISE,
      };
      const newStatus = statusMap[sheet];
      const updateData: Record<string, unknown> = {
        last_status: batch.status,
        status: newStatus,
      };
      if (reason) updateData.non_compliance_reason = reason;
      await supabase.from("batches").update(updateData).eq("id", batch.id);
    }

    setSheet(null);
    navigate(-1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-app flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-amber-900/20 border-t-amber-900 rounded-full animate-spin" />
      </div>
    );
  }

  if (!batch) {
    return (
      <div className="min-h-screen bg-app flex flex-col items-center justify-center gap-3">
        <p className="text-slate-500 font-medium text-sm">Lot introuvable.</p>
        <button
          onClick={() => navigate(`/boutique/${shopId}`)}
          className="text-xs font-bold text-teal-700 underline underline-offset-2"
        >
          Retour au suivi
        </button>
      </div>
    );
  }

  const dates =
    batch.week_receiving && batch.products.week_lifetime != null
      ? computeBatchesDates(batch.week_receiving, batch.products.week_lifetime)
      : null;

  const statusInfo = getStatusStyle(batch.status);

  const isActive =
    batch.status !== BatchStatus.PERIME &&
    batch.status !== BatchStatus.NON_CONFORME &&
    batch.status !== BatchStatus.EPUISE;

  const showOuvrir = batch.status === BatchStatus.STOCK;
  const showMisEnVente = batch.status !== BatchStatus.EN_VENTE;
  const actionCount = (showOuvrir ? 1 : 0) + (showMisEnVente ? 1 : 0) + 4;

  const receivingShort = batch.week_receiving.split("-")[0];
  const expiryShort = dates?.expiryWeek.split("-")[0] ?? "—";

  const retraitStr = batch.withdrawal_date
    ? formatDate(new Date(batch.withdrawal_date))
    : batch.expiration_date
      ? formatDate(
          new Date(new Date(batch.expiration_date).getTime() - 14 * 86400000),
        )
      : dates?.withdrawalDate ?? "—";

  const perimeStr = batch.expiration_date
    ? formatDate(new Date(batch.expiration_date))
    : dates?.expiryDate ?? "—";

  const ouvertureDate = batch.week_opening
    ? (() => {
        const d = parseWeekLabel(batch.week_opening);
        return d ? formatDate(d) : batch.week_opening;
      })()
    : null;

  const receptionDate = (() => {
    const d = parseWeekLabel(batch.week_receiving);
    return d ? formatDate(d) : batch.week_receiving;
  })();

  return (
    <>
      <div className="min-h-screen bg-app pb-36 font-sans antialiased">
        {/* Header */}
        <header className="bg-ink-800 text-white px-4 pt-10 pb-5 sticky top-0 z-10">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-widest text-foam-100/50 mb-3 active:opacity-70 transition-opacity"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
              stroke="currentColor"
              className="w-3.5 h-3.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 19.5 8.25 12l7.5-7.5"
              />
            </svg>
            Suivi
          </button>

          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-2xl font-black tracking-tight text-foam-100 leading-tight truncate">
                {batch.products.name}
              </h1>
              <p className="text-foam-100/40 text-xs mt-1 font-medium tracking-wide">
                Réf {batch.reference}
              </p>
            </div>
            <span
              className={`shrink-0 mt-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${statusInfo.bg} ${statusInfo.text} border-current/10`}
            >
              {statusInfo.label}
            </span>
          </div>
        </header>

        <div className="px-4 mt-4 flex flex-col gap-3">
          {/* Fraîcheur */}
          {batch.products.week_lifetime != null && (
            <section className="bg-white rounded-2xl p-4 border border-slate-200 shadow-card">
              <p className="text-[10px] uppercase font-black tracking-widest text-amber-900/35 mb-3">
                Fraîcheur
              </p>
              <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1.5">
                <span>REÇU {receivingShort}</span>
                <span>PÉR. {expiryShort}</span>
              </div>
              <FreshnessMeter
                weekReceiving={batch.week_receiving}
                lifeWeeks={batch.products.week_lifetime}
                withdrawalDate={batch.withdrawal_date}
                expirationDate={batch.expiration_date}
              />
            </section>
          )}

          {/* Info grid 2×2 */}
          <div className="grid grid-cols-2 gap-3">
            <InfoCard
              label="Catégorie"
              value={batch.products.category ?? "—"}
            />
            <InfoCard
              label="Quantité"
              value={`${batch.quantity} boîte${batch.quantity > 1 ? "s" : ""}`}
            />
            <InfoCard
              label="Durée de vie"
              value={
                batch.products.week_lifetime != null
                  ? `${batch.products.week_lifetime} sem.`
                  : "—"
              }
            />
            <InfoCard label="Péremption" value={perimeStr} />
          </div>

          {/* Traçabilité */}
          <section className="bg-white rounded-2xl p-4 border border-slate-200 shadow-card">
            <p className="text-[10px] uppercase font-black tracking-widest text-amber-900/35 mb-4">
              Traçabilité
            </p>
            <div className="flex flex-col">
              <TimelineItem
                color="bg-green-500"
                label="Réception"
                value={receptionDate}
                hasLine
              />
              <TimelineItem
                color={batch.week_opening ? "bg-teal-400" : "bg-stone-200"}
                label="Ouverture"
                value={ouvertureDate ?? "Non ouvert"}
                muted={!batch.week_opening}
                hasLine
              />
              <TimelineItem
                color="bg-amber-400"
                label="Retrait prévu"
                value={retraitStr}
                hasLine
              />
              <TimelineItem
                color="bg-red-500"
                label="Péremption"
                value={perimeStr}
                hasLine={false}
              />
            </div>
          </section>

          {/* Actions */}
          {isActive && (
            <div className="grid grid-cols-2 gap-3">
              {showOuvrir && (
                <button
                  onClick={() => setSheet("ouvrir")}
                  className="min-h-13 bg-teal-50 text-teal-700 border border-teal-200/60 hover:bg-teal-100 rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  🔓 Ouvrir le lot
                </button>
              )}
              {showMisEnVente && (
                <button
                  onClick={handleMiseEnVente}
                  className="min-h-13 bg-sky-100 text-sky-700 border border-sky-200 hover:bg-sky-200 rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  🏷 Mis en vente
                </button>
              )}
              <button
                onClick={() => setSheet("perime")}
                className="min-h-13 bg-red-50/70 text-red-600 border border-red-100 hover:bg-red-50 rounded-2xl text-sm font-bold transition-all flex items-center justify-center active:scale-95"
              >
                Périmé
              </button>
              <button
                onClick={() => setSheet("non_conforme")}
                className="min-h-13 bg-purple-50 text-purple-600 border border-purple-100 hover:bg-purple-100 rounded-2xl text-sm font-bold transition-all flex items-center justify-center active:scale-95"
              >
                Non conf.
              </button>
              <button
                onClick={() => setSheet("epuise")}
                className="min-h-13 bg-sunk text-stone-600 border border-stone-200/80 hover:bg-stone-100 rounded-2xl text-sm font-bold transition-all flex items-center justify-center active:scale-95"
              >
                Épuisé
              </button>
              <button
                onClick={() => navigate(-1)}
                className={`min-h-13 bg-ink-800 text-foam-100 hover:bg-ink-900 rounded-2xl text-sm font-bold transition-all flex items-center justify-center active:scale-95 ${
                  actionCount % 2 !== 0 ? "col-span-2" : ""
                }`}
              >
                Retour
              </button>
            </div>
          )}

          {batch.status === BatchStatus.PERIME && (
            <button
              onClick={() => setSheet("supprimer")}
              className="w-full min-h-13 bg-red-600 text-white hover:bg-red-700 rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              🗑 Supprimer définitivement
            </button>
          )}

          {!isActive && batch.status !== BatchStatus.PERIME && (
            <button
              onClick={() => navigate(-1)}
              className="w-full min-h-13 bg-ink-800 text-foam-100 hover:bg-ink-900 rounded-2xl text-sm font-bold transition-all flex items-center justify-center active:scale-95"
            >
              Retour
            </button>
          )}
        </div>
      </div>

      <BottomSheet
        open={!!sheet}
        {...(sheet ? SHEET_CONFIG[sheet] : SHEET_CONFIG.perime)}
        onConfirm={handleConfirm}
        onCancel={() => setSheet(null)}
      />
    </>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-card flex flex-col gap-1">
      <p className="text-[10px] uppercase font-black tracking-widest text-amber-900/35">
        {label}
      </p>
      <p className="text-sm font-bold text-[#3E2723] leading-snug">{value}</p>
    </div>
  );
}

function TimelineItem({
  color,
  label,
  value,
  muted = false,
  hasLine,
}: {
  color: string;
  label: string;
  value: string;
  muted?: boolean;
  hasLine: boolean;
}) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center w-4 shrink-0">
        <div className={`w-3 h-3 rounded-full ${color} shrink-0 mt-0.5`} />
        {hasLine && (
          <div className="w-px flex-1 bg-stone-100 mt-1 mb-1 min-h-5" />
        )}
      </div>
      <div className={`min-w-0 ${hasLine ? "pb-4" : "pb-0"}`}>
        <p
          className={`text-[11px] uppercase font-bold tracking-wider ${muted ? "text-slate-300" : "text-slate-400"}`}
        >
          {label}
        </p>
        <p
          className={`text-sm font-semibold mt-0.5 ${muted ? "text-slate-300" : "text-[#3E2723]"}`}
        >
          {value}
        </p>
      </div>
    </div>
  );
}
