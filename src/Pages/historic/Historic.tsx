import { useEffect, useState } from "react";
import { supabase } from "../../utils/supabase";
import { BatchStatus } from "../../types/batch";
import { useShop } from "../../context/ShopContext";

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

export default function Historic() {
  const [entries, setEntries] = useState<HistoricEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<
    "tous" | BatchStatus.PERIME | BatchStatus.NON_CONFORME | BatchStatus.EPUISE
  >("tous");

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const { shop } = useShop();

  const toggleGroup = (date: string) => {
    setOpenGroups((prev) => ({ ...prev, [date]: !prev[date] }));
  };

  const fetchHistoric = async () => {
    if (!shop) return;
    const { data, error } = await supabase
      .from("historic")
      .select("*")
      .eq("shop_id", shop.id)
      .order("created_at", { ascending: false });
    if (!error) setEntries(data || []);
    setLoading(false);
  };

  console.log("Historic entries", entries);
  useEffect(() => {
    if (!shop) return;
    fetchHistoric();
  }, [shop]);
  const filtered = entries.filter(
    (e) => filter === "tous" || e.status === filter,
  );

  const counts = {
    perime: entries.filter((e) => e.status === BatchStatus.PERIME).length,
    non_conforme: entries.filter((e) => e.status === BatchStatus.NON_CONFORME)
      .length,
    epuise: entries.filter((e) => e.status === BatchStatus.EPUISE).length,
  };

  const groupByDate = (entries: HistoricEntry[]) => {
    return entries.reduce(
      (groups, entry) => {
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
  };
  const grouped = groupByDate(filtered);

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

  return (
    <div className="min-h-screen bg-app pb-24 font-sans antialiased">
      <header className="bg-ink-800 text-white px-4 pt-8 pb-6 sticky top-0 z-10 shadow-md">
        <div>
          <h1 className="text-xl font-black tracking-tight text-foam-100">
            Historique
          </h1>
          <p className="text-teal-300/60 text-xs mt-0.5 font-medium">
            Traçabilité complète des lots retirés
          </p>
        </div>
      </header>

      <div className="px-4 mt-5 grid grid-cols-3 gap-3">
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
            className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-all border
              ${
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

      {/* Liste */}
      {Object.entries(grouped).map(([date, entries]) => (
        <div key={date} className="mb-2">
          {/* Header dropdown */}
          <button
            onClick={() => toggleGroup(date)}
            className="w-full flex items-center justify-between px-4 py-3 bg-card rounded-2xl border border-slate-200 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-400uppercase tracking-wider">
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
              className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                openGroups[date] ? "rotate-180" : ""
              }`}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m19.5 8.25-7.5 7.5-7.5-7.5"
              />
            </svg>
          </button>

          {/* Contenu dépliable */}
          {openGroups[date] && (
            <div className="mt-2 flex flex-col gap-2 pl-2">
              {entries.map((entry) => {
                const style = STATUS_STYLE[entry.status] || STATUS_STYLE.epuise;
                return (
                  <div
                    key={entry.id}
                    className="bg-card rounded-2xl p-4 border border-slate-200 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-bold text-[#3E2723] text-sm truncate">
                          {entry.type_name}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Réf :{" "}
                          <span className="font-semibold text-stone-600">
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
      ))}
    </div>
  );
}
