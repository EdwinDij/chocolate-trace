import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../../utils/supabase";
import { BatchStatus } from "../../types/batch";
import { useShop } from "../../context/ShopContext";
import { exportToCSV, exportToPDF } from "../../utils/export";
import { Download } from "lucide-react";
import { usePlanGate } from "../../hooks/usePlanGate";

interface HistoricEntry {
  id: string;
  type_name: string;
  reference: string;
  status: string;
  reason: string | null;
  week_receiving: string;
  created_at: string;
}

const STATUS_STYLE: Record<
  string,
  { bg: string; text: string; label: string }
> = {
  [BatchStatus.PERIME]: {
    bg: "bg-red-100",
    text: "text-red-600",
    label: "Périmé",
  },
  [BatchStatus.NON_CONFORME]: {
    bg: "bg-purple-100",
    text: "text-purple-600",
    label: "Non conforme",
  },
  [BatchStatus.EPUISE]: {
    bg: "bg-stone-100",
    text: "text-slate-500",
    label: "Épuisé",
  },
};

type PeriodMode = "mois" | "libre";

export default function Historic() {
  const [entries, setEntries] = useState<HistoricEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<
    "tous" | BatchStatus.PERIME | BatchStatus.NON_CONFORME | BatchStatus.EPUISE
  >("tous");
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [showExport, setShowExport] = useState(false);
  const [periodMode, setPeriodMode] = useState<PeriodMode>("mois");
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const { isGratuit } = usePlanGate();
  const { id } = useParams<{ id: string }>();
  const { shop, member } = useShop();
  const shopId = id ?? shop?.id;
  const canExport = member?.role !== undefined && !isGratuit;

  const toggleGroup = (date: string) => {
    setOpenGroups((prev) => ({ ...prev, [date]: !prev[date] }));
  };

  const fetchHistoric = async () => {
    if (!shopId) return;
    const { data, error } = await supabase
      .from("historic")
      .select("*")
      .eq("shop_id", shopId)
      .order("created_at", { ascending: false });
    if (!error) setEntries(data || []);
    setLoading(false);
  };

  useEffect(() => {
    if (!shopId) return;
    fetchHistoric();
  }, [shopId]);

  useEffect(() => {
    if (entries.length === 0) return;
    const firstDate = new Date(entries[0].created_at).toLocaleDateString(
      "fr-FR",
      {
        day: "numeric",
        month: "long",
        year: "numeric",
      },
    );
    setOpenGroups({ [firstDate]: true });
  }, [entries]);

  const getFilteredForExport = (): {
    data: HistoricEntry[];
    period: string;
  } => {
    if (periodMode === "mois") {
      const [year, month] = selectedMonth.split("-");
      const from = new Date(parseInt(year), parseInt(month) - 1, 1);
      const to = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
      const data = entries.filter((e) => {
        const d = new Date(e.created_at);
        return d >= from && d <= to;
      });
      const period = from.toLocaleDateString("fr-FR", {
        month: "long",
        year: "numeric",
      });
      return { data, period };
    } else {
      const from = dateFrom ? new Date(dateFrom) : new Date(0);
      const to = dateTo ? new Date(dateTo + "T23:59:59") : new Date();
      const data = entries.filter((e) => {
        const d = new Date(e.created_at);
        return d >= from && d <= to;
      });
      const period = `${dateFrom || "début"} au ${dateTo || "aujourd'hui"}`;
      return { data, period };
    }
  };

  const handleExportCSV = () => {
    const { data, period } = getFilteredForExport();
    exportToCSV(data, shop?.name ?? "Boutique", period);
  };

  const handleExportPDF = () => {
    const { data, period } = getFilteredForExport();
    exportToPDF(data, shop?.name ?? "Boutique", period);
  };

  const filtered = entries.filter(
    (e) => filter === "tous" || e.status === filter,
  );
  const counts = {
    perime: entries.filter((e) => e.status === BatchStatus.PERIME).length,
    non_conforme: entries.filter((e) => e.status === BatchStatus.NON_CONFORME)
      .length,
    epuise: entries.filter((e) => e.status === BatchStatus.EPUISE).length,
  };
  const grouped = entries.reduce(
    (groups, entry) => {
      if (filter !== "tous" && entry.status !== filter) return groups;
      const date = new Date(entry.created_at).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      if (!groups[date]) groups[date] = [];
      groups[date].push(entry);
      return groups;
    },
    {} as Record<string, HistoricEntry[]>,
  );

  return (
    <div className="min-h-screen bg-app pb-36 lg:pb-8 font-sans antialiased">
      <header className="bg-ink-800 text-white px-4 pt-8 pb-6 sticky top-0 z-10 shadow-md">
        <div className="flex items-start justify-between">
          <div className="lg:hidden">
            <h1 className="text-xl font-black tracking-tight text-foam-100">
              Historique
            </h1>
            <p className="text-teal-300/60 text-xs mt-0.5 font-medium">
              {shop?.name} — Lots retirés
            </p>
          </div>
          {/* Bouton export */}
          {canExport ? (
            <button
              onClick={() => setShowExport(!showExport)}
              className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold px-3 py-2 rounded-xl transition-colors active:scale-95"
            >
              <Download size={14} />
              Exporter
            </button>
          ) : (
            <div
              className="flex items-center gap-1.5 bg-slate-700 text-slate-400 text-xs font-bold px-3 py-2 rounded-xl cursor-not-allowed"
              title="Disponible à partir du plan Boutique"
            >
              <Download size={14} />
              Export
              <span className="text-[9px] bg-slate-600 px-1.5 py-0.5 rounded-full">
                Pro
              </span>
            </div>
          )}
        </div>
      </header>

      {/* Panneau export */}
      {showExport && canExport && (
        <div className="mx-4 mt-4 bg-card rounded-2xl p-4 border border-slate-200 shadow-card lg:max-w-xl lg:mx-auto lg:mt-4">
          <h2 className="text-micro font-bold text-slate-400 uppercase tracking-wider mb-4">
            Exporter l'historique
          </h2>

          {/* Toggle mode période */}
          <div className="flex bg-slate-100 rounded-xl p-1 mb-4">
            <button
              onClick={() => setPeriodMode("mois")}
              className={`flex-1 py-2 rounded-[10px] text-xs font-bold transition-all ${
                periodMode === "mois"
                  ? "bg-card text-slate-800 shadow-sm"
                  : "text-slate-400"
              }`}
            >
              Par mois
            </button>
            <button
              onClick={() => setPeriodMode("libre")}
              className={`flex-1 py-2 rounded-[10px] text-xs font-bold transition-all ${
                periodMode === "libre"
                  ? "bg-card text-slate-800 shadow-sm"
                  : "text-slate-400"
              }`}
            >
              Période libre
            </button>
          </div>

          {/* Sélection période */}
          {periodMode === "mois" ? (
            <div className="mb-4">
              <label className="text-micro font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">
                Mois
              </label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-sunk focus:outline-none focus:border-teal-500 text-slate-800"
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="text-micro font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">
                  Du
                </label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-sunk focus:outline-none focus:border-teal-500 text-slate-800"
                />
              </div>
              <div>
                <label className="text-micro font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">
                  Au
                </label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-sunk focus:outline-none focus:border-teal-500 text-slate-800"
                />
              </div>
            </div>
          )}

          {/* Boutons export */}
          <div className="flex gap-3">
            <button
              onClick={handleExportCSV}
              className="flex-1 flex items-center justify-center gap-2 bg-sunk border border-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-sm transition-all hover:bg-slate-100 active:scale-95"
            >
              <Download size={15} />
              Télécharger en CSV
            </button>
            <button
              onClick={handleExportPDF}
              className="flex-1 flex items-center justify-center gap-2 bg-ink-800 hover:bg-ink-900 text-white font-bold py-2.5 rounded-xl text-sm transition-all active:scale-95"
            >
              <Download size={15} />
              Télécharger en PDF
            </button>
          </div>
        </div>
      )}

      {/* KPI */}
      <div className="px-4 mt-5 grid grid-cols-3 gap-3 lg:max-w-3xl lg:mx-auto">
        <div className="bg-card border border-red-100 rounded-2xl p-3 text-center">
          <p className="text-2xl font-black text-red-600">{counts.perime}</p>
          <p className="text-[10px] text-red-400 font-bold uppercase mt-0.5">
            Périmés
          </p>
        </div>
        <div className="bg-card border border-purple-100 rounded-2xl p-3 text-center">
          <p className="text-2xl font-black text-purple-600">
            {counts.non_conforme}
          </p>
          <p className="text-[10px] text-purple-400 font-bold uppercase mt-0.5">
            Non conformes
          </p>
        </div>
        <div className="bg-card border border-stone-200 rounded-2xl p-3 text-center">
          <p className="text-2xl font-black text-slate-500">{counts.epuise}</p>
          <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">
            Épuisés
          </p>
        </div>
      </div>

      {/* Filtres */}
      <div className="px-6 mt-4 flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 justify-center">
        {(
          [
            "tous",
            BatchStatus.PERIME,
            BatchStatus.NON_CONFORME,
            BatchStatus.EPUISE,
          ] as const
        ).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${
              filter === f
                ? "bg-ink-800 text-foam-100 border-amber-900/20"
                : "bg-card text-slate-500 border-stone-200"
            }`}
          >
            {f === "tous"
              ? "Tous"
              : f === BatchStatus.PERIME
                ? "Périmés"
                : f === BatchStatus.NON_CONFORME
                  ? "Non conformes"
                  : "Épuisés"}
          </button>
        ))}
      </div>

      <div className="px-4 mt-4 flex flex-col gap-2 lg:max-w-3xl lg:mx-auto">
        {loading ? (
          <div className="flex justify-center pt-12">
            <div className="w-5 h-5 border-2 border-ink-800/20 border-t-ink-800 rounded-full animate-spin" />
          </div>
        ) : Object.keys(grouped).length === 0 ? (
          <p className="text-center text-slate-400 text-sm py-8 bg-card rounded-2xl border border-slate-200 font-medium">
            Aucune entrée dans l'historique.
          </p>
        ) : (
          Object.entries(grouped).map(([date, entries]) => (
            <div key={date} className="mb-2">
              <button
                onClick={() => toggleGroup(date)}
                className="w-full flex items-center justify-between px-4 py-3 bg-card rounded-2xl border border-slate-200 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {date}
                  </span>
                  <span className="text-[10px] font-bold bg-amber-100 text-teal-700 px-2 py-0.5 rounded-full">
                    {entries.length} lot{entries.length > 1 ? "s" : ""}
                  </span>
                </div>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                  stroke="currentColor"
                  className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${openGroups[date] ? "rotate-180" : ""}`}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m19.5 8.25-7.5 7.5-7.5-7.5"
                  />
                </svg>
              </button>

              {openGroups[date] && (
                <div className="mt-2 flex flex-col gap-2 pl-2">
                  {entries.map((entry) => {
                    const style =
                      STATUS_STYLE[entry.status] ??
                      STATUS_STYLE[BatchStatus.EPUISE];
                    return (
                      <div
                        key={entry.id}
                        className="bg-card rounded-2xl p-4 border border-slate-200 shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-bold text-slate-800 text-sm truncate">
                              {entry.type_name}
                            </p>
                            <p className="text-xs text-slate-400 mt-0.5">
                              Réf :{" "}
                              <span className="font-semibold text-slate-600">
                                {entry.reference}
                              </span>
                              {" · "}Reçu{" "}
                              <span className="font-semibold">
                                {entry.week_receiving}
                              </span>
                            </p>
                          </div>
                          <span
                            className={`shrink-0 text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${style.bg} ${style.text}`}
                          >
                            {style.label}
                          </span>
                        </div>
                        {entry.reason && (
                          <p className="mt-2 text-xs text-purple-700 bg-purple-50 rounded-lg px-3 py-1.5 font-medium">
                            Raison : {entry.reason}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
