import { useEffect, useState } from "react";
import { Batch } from "../../types/batch";
import { formatDateFR } from "../../utils/dates";

export interface EditLotUpdates {
  reference: string;
  expiration_date: string | null;
  withdrawal_date: string | null;
}

interface EditLotModalProps {
  open: boolean;
  batch: Batch;
  onSave: (id: string, updates: EditLotUpdates) => void;
  onCancel: () => void;
}

export default function EditLotModal({
  open,
  batch,
  onSave,
  onCancel,
}: EditLotModalProps) {
  const [reference, setReference] = useState(batch.reference);
  const [expirationDate, setExpirationDate] = useState(
    batch.expiration_date ?? "",
  );
  const [withdrawalDate, setWithdrawalDate] = useState(
    batch.withdrawal_date ?? "",
  );
  const [differentWithdrawal, setDifferentWithdrawal] = useState(
    !!batch.withdrawal_date &&
      batch.withdrawal_date !== batch.expiration_date,
  );

  useEffect(() => {
    if (!open) return;
    setReference(batch.reference);
    setExpirationDate(batch.expiration_date ?? "");
    setWithdrawalDate(batch.withdrawal_date ?? batch.expiration_date ?? "");
    setDifferentWithdrawal(
      !!batch.withdrawal_date &&
        batch.withdrawal_date !== batch.expiration_date,
    );
  }, [open, batch]);

  if (!open) return null;

  const handleSave = () => {
    if (!reference.trim()) return;
    onSave(batch.id, {
      reference: reference.trim(),
      expiration_date: expirationDate || null,
      withdrawal_date: differentWithdrawal
        ? withdrawalDate || null
        : null,
    });
  };

  return (
    <div className="fixed inset-0 z-[60] flex flex-col justify-end">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div className="relative bg-white rounded-t-3xl px-5 pt-5 pb-8 shadow-2xl animate-sheet-up">
        <div className="w-10 h-1 bg-stone-200 rounded-full mx-auto mb-5" />

        <h3 className="font-black text-[#3E2723] text-base mb-1">
          Modifier le lot
        </h3>
        <p className="text-sm text-slate-500 font-medium mb-4">
          {batch.products.name}
        </p>

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
        </div>

        <div className="flex gap-3 mt-2">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-2xl bg-stone-100 text-slate-600 font-bold text-sm hover:bg-stone-200 active:scale-95 transition-all"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={!reference.trim()}
            className="flex-1 py-3 rounded-2xl font-bold text-sm active:scale-95 transition-all disabled:opacity-40 bg-ink-800 hover:bg-ink-900 text-foam-100"
          >
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}
