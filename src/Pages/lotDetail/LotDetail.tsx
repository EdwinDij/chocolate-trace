import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../../utils/supabase";
import { Batch } from "../../types/batch";
import {
  computeBatchesDates,
  formatDateFR,
  getStatusStyle,
} from "../../utils/dates";
import FreshnessMeter from "../../components/lotCard/FreshnessMeter";

export default function LotDetail() {
  const { id: shopId, batchId } = useParams();
  const navigate = useNavigate();
  const [batch, setBatch] = useState<Batch | null>(null);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="min-h-screen bg-app pb-36 font-sans antialiased">
      <header className="bg-ink-800 text-white px-4 pt-8 pb-6 sticky top-0 z-10 shadow-md">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 shrink-0 flex items-center justify-center rounded-full border border-foam-100/20 active:scale-95 transition-all"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
              stroke="currentColor"
              className="w-5 h-5 text-foam-100"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 19.5 8.25 12l7.5-7.5"
              />
            </svg>
          </button>
          <div className="min-w-0">
            <h1 className="text-xl font-black tracking-tight text-foam-100 truncate">
              {batch.products.name}
            </h1>
            <p className="text-teal-300/60 text-xs mt-0.5 font-medium">
              {batch.reference}
            </p>
          </div>
        </div>
      </header>

      <div className="px-4 mt-5 flex flex-col gap-4">
        {/* Statut + jauge */}
        <div className="bg-card rounded-2xl p-4 border border-slate-200 shadow-card">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] uppercase font-bold text-amber-900/40 tracking-wider">
              Statut
            </p>
            <span
              className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${statusInfo.bg} ${statusInfo.text} border-current/10`}
            >
              {statusInfo.label}
            </span>
          </div>
          {batch.products.week_lifetime != null && (
            <FreshnessMeter
              weekReceiving={batch.week_receiving}
              lifeWeeks={batch.products.week_lifetime}
              withdrawalDate={batch.withdrawal_date}
              expirationDate={batch.expiration_date}
            />
          )}
        </div>

        {/* Informations du lot */}
        <div className="bg-card rounded-2xl p-4 border border-slate-200 shadow-card">
          <p className="text-[11px] uppercase font-bold text-amber-900/40 tracking-wider mb-3">
            Informations
          </p>
          <div className="flex flex-col gap-2.5 text-sm">
            <InfoRow label="Produit" value={batch.products.name} />
            <InfoRow label="Référence" value={batch.reference} />
            <InfoRow
              label="Quantité"
              value={`${batch.quantity} boîte${batch.quantity > 1 ? "s" : ""}`}
            />
            {batch.products.category && (
              <InfoRow label="Catégorie" value={batch.products.category} />
            )}
            {batch.products.week_lifetime != null && (
              <InfoRow
                label="Durée de vie"
                value={`${batch.products.week_lifetime} semaines`}
              />
            )}
            <InfoRow label="Semaine de réception" value={batch.week_receiving} />
            {batch.week_opening && (
              <InfoRow
                label="Semaine d'ouverture"
                value={batch.week_opening}
              />
            )}
            {batch.expiration_date && (
              <InfoRow
                label="DLC"
                value={formatDateFR(batch.expiration_date)}
              />
            )}
            {batch.withdrawal_date && (
              <InfoRow
                label="Date de retrait"
                value={formatDateFR(batch.withdrawal_date)}
              />
            )}
            {!batch.withdrawal_date && !batch.expiration_date && dates && (
              <InfoRow label="Retrait estimé" value={dates.withdrawalDate} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start gap-3 py-1 border-b border-stone-50 last:border-0">
      <span className="text-slate-400 font-medium shrink-0">{label}</span>
      <span className="font-semibold text-slate-700 text-right">{value}</span>
    </div>
  );
}
