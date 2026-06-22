import { useEffect, useRef, useState } from "react";

export interface BottomSheetProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel: string;
  confirmVariant?: "danger" | "warning" | "default";
  withReason?: boolean;
  reasonPlaceholder?: string;
  onConfirm: (reason?: string) => void;
  onCancel: () => void;
}

const VARIANT_CLASS: Record<string, string> = {
  danger: "bg-red-600 hover:bg-red-700 text-white",
  warning: "bg-amber-500 hover:bg-amber-600 text-white",
  default: "bg-ink-800 hover:bg-ink-900 text-foam-100",
};

export default function BottomSheet({
  open,
  title,
  description,
  confirmLabel,
  confirmVariant = "default",
  withReason,
  reasonPlaceholder,
  onConfirm,
  onCancel,
}: BottomSheetProps) {
  const [reason, setReason] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && withReason) {
      const t = setTimeout(() => inputRef.current?.focus(), 120);
      return () => clearTimeout(t);
    }
    if (!open) setReason("");
  }, [open, withReason]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col justify-end">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div className="relative bg-white rounded-t-3xl px-5 pt-5 pb-8 shadow-2xl animate-sheet-up">
        <div className="w-10 h-1 bg-stone-200 rounded-full mx-auto mb-5" />

        <h3 className="font-black text-[#3E2723] text-base mb-1">{title}</h3>

        {description && (
          <p className="text-sm text-slate-500 font-medium mb-4">{description}</p>
        )}

        {withReason && (
          <input
            ref={inputRef}
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={reasonPlaceholder ?? "Raison..."}
            className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm font-medium focus:outline-none focus:border-teal-500 bg-sunk placeholder-stone-400 shadow-inner mb-4"
          />
        )}

        <div className="flex gap-3 mt-2">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-2xl bg-stone-100 text-slate-600 font-bold text-sm hover:bg-stone-200 active:scale-95 transition-all"
          >
            Annuler
          </button>
          <button
            onClick={() => onConfirm(withReason ? reason : undefined)}
            disabled={withReason ? !reason.trim() : false}
            className={`flex-1 py-3 rounded-2xl font-bold text-sm active:scale-95 transition-all disabled:opacity-40 ${VARIANT_CLASS[confirmVariant]}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
