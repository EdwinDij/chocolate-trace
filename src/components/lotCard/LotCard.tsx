import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Batch, BatchStatus } from "../../types/batch";
import {
  computeBatchesDates,
  computeStatusFromDates,
  formatDateFR,
  getStatusStyle,
} from "../../utils/dates";
import FreshnessMeter from "./FreshnessMeter";
import BottomSheet, { BottomSheetProps } from "../BottomSheet";

type SheetType = "perime" | "non_conforme" | "epuise" | "supprimer";

type SheetConfig = Omit<BottomSheetProps, "open" | "onConfirm" | "onCancel">;

const SHEET_CONFIG: Record<SheetType, SheetConfig> = {
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

export interface LotCardProps {
  batch: Batch;
  dates: ReturnType<typeof computeBatchesDates>;
  onOpen: (id: string) => void;
  onUpdateStatus: (id: string, status: BatchStatus, reason?: string) => void;
  onDelete: (id: string) => void;
  onUndo: (batch: Batch) => void;
}

export default function LotCard({
  batch,
  dates,
  onOpen,
  onUpdateStatus,
  onDelete,
  onUndo,
}: LotCardProps) {
  const [sheet, setSheet] = useState<SheetType | null>(null);
  const navigate = useNavigate();
  const { id: shopId } = useParams();

  const getStatusInfo = () => {
    if (batch.status === BatchStatus.PERIME)
      return getStatusStyle(BatchStatus.PERIME);
    if (batch.status === BatchStatus.NON_CONFORME)
      return getStatusStyle(BatchStatus.NON_CONFORME);
    if (batch.status === BatchStatus.STOCK || !batch.week_opening)
      return getStatusStyle(BatchStatus.STOCK);
    if (batch.withdrawal_date || batch.expiration_date)
      return getStatusStyle(
        computeStatusFromDates(batch.withdrawal_date, batch.expiration_date),
      );
    if (!dates) return getStatusStyle(BatchStatus.STOCK);
    return getStatusStyle(dates.status);
  };

  const statusInfo = getStatusInfo();
  const isCritical =
    batch.status === BatchStatus.PERIME || statusInfo.label === "À retirer";

  const isActive =
    batch.status !== BatchStatus.PERIME &&
    batch.status !== BatchStatus.NON_CONFORME &&
    batch.status !== BatchStatus.EPUISE;

  const handleConfirm = (reason?: string) => {
    if (!sheet) return;
    if (sheet === "supprimer") onDelete(batch.id);
    else if (sheet === "perime") onUpdateStatus(batch.id, BatchStatus.PERIME);
    else if (sheet === "non_conforme")
      onUpdateStatus(batch.id, BatchStatus.NON_CONFORME, reason);
    else if (sheet === "epuise") onUpdateStatus(batch.id, BatchStatus.EPUISE);
    setSheet(null);
  };

  return (
    <>
      <div
        onClick={() => navigate(`/boutique/${shopId}/lot/${batch.id}`)}
        className={`bg-white rounded-2xl p-4 border transition-all cursor-pointer active:scale-[0.99] ${
          isCritical
            ? "border-red-200 bg-gradient-to-b from-red-50/30 to-white"
            : "border-slate-200 hover:border-teal-700/25"
        } shadow-card`}
      >
        {/* En-tête */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-bold text-[#3E2723] text-[15px] tracking-tight leading-tight truncate">
              {batch.products.name}
            </p>
            <p className="text-xs text-slate-400 mt-0.5 font-medium">
              Réf :{" "}
              <span className="font-semibold text-slate-600">
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

        {/* Jauge de fraîcheur */}
        {batch.products.week_lifetime != null && isActive && (
          <FreshnessMeter
            weekReceiving={batch.week_receiving}
            lifeWeeks={batch.products.week_lifetime}
            withdrawalDate={batch.withdrawal_date}
            expirationDate={batch.expiration_date}
          />
        )}

        {/* Méta-chips */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-3 pt-3 border-t border-stone-100 text-xs text-slate-500 font-medium">
          <span>
            📦 Reçu{" "}
            <strong className="text-stone-700">{batch.week_receiving}</strong>
          </span>
          {batch.week_opening && (
            <span>
              🔓 Ouvert{" "}
              <strong className="text-stone-700">{batch.week_opening}</strong>
            </span>
          )}
          {batch.expiration_date && (
            <span>
              ⏱ DLC{" "}
              <strong className="text-stone-700">
                {formatDateFR(batch.expiration_date)}
              </strong>
            </span>
          )}
          {(batch.withdrawal_date || batch.expiration_date) && (
            <span className="ml-auto text-amber-900/80">
              📅 Retrait :{" "}
              <strong className="font-bold text-amber-900">
                {formatDateFR(batch.withdrawal_date ?? batch.expiration_date!)}
              </strong>
            </span>
          )}
          {!batch.expiration_date && !batch.withdrawal_date && dates && (
            <span className="ml-auto text-amber-900/80">
              📅 Retrait :{" "}
              <strong className="font-bold text-amber-900">
                {dates.withdrawalDate}
              </strong>
            </span>
          )}
        </div>

        {/* Actions */}
        <div
          className="mt-4"
          onClick={(e) => e.stopPropagation()}
        >
          {isActive && (
            <div
              className={`grid gap-2 ${
                batch.status === BatchStatus.STOCK ? "grid-cols-2" : "grid-cols-3"
              }`}
            >
              {batch.status === BatchStatus.STOCK && (
                <button
                  onClick={() => onOpen(batch.id)}
                  className="min-h-[44px] bg-teal-50 text-teal-700 border border-teal-200/60 hover:bg-teal-100 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-95"
                >
                  🔓 Ouvrir
                </button>
              )}
              <button
                onClick={() => setSheet("perime")}
                className="min-h-[44px] bg-red-50/60 text-red-600 border border-red-100 hover:bg-red-50 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center active:scale-95"
              >
                Périmé
              </button>
              <button
                onClick={() => setSheet("non_conforme")}
                className="min-h-[44px] bg-purple-50 text-purple-600 border border-purple-100 hover:bg-purple-100 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center active:scale-95"
              >
                Non conf.
              </button>
              <button
                onClick={() => setSheet("epuise")}
                className="min-h-[44px] bg-sunk text-stone-600 border border-stone-200/80 hover:bg-stone-100 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center active:scale-95"
              >
                Épuisé
              </button>
            </div>
          )}

          {batch.status === BatchStatus.PERIME && (
            <button
              onClick={() => setSheet("supprimer")}
              className="w-full min-h-[44px] bg-red-600 text-white hover:bg-red-700 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-95"
            >
              🗑 Supprimer définitivement du registre
            </button>
          )}

          {batch.last_status && (
            <button
              onClick={() => onUndo(batch)}
              className="w-full mt-2 min-h-[44px] bg-stone-100 text-stone-600 border border-stone-200 hover:bg-stone-200 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-95"
            >
              ↩ Annuler — remettre en «{batch.last_status}»
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
