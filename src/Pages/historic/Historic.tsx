import { useEffect, useState } from "react";
import { supabase } from "../../utils/supabase";

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
  perime: { bg: "bg-red-100", text: "text-red-600", label: "Périmé" },
  non_conforme: {
    bg: "bg-purple-100",
    text: "text-purple-600",
    label: "Non conforme",
  },
  epuise: { bg: "bg-stone-100", text: "text-stone-500", label: "Épuisé" },
};

export default function Historic() {
  const [entries, setEntries] = useState<HistoricEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<
    "tous" | "perime" | "non_conforme" | "epuise"
  >("tous");

  const fetchHistoric = async () => {
    const { data, error } = await supabase
      .from("historic")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error) setEntries(data || []);
    setLoading(false);
  };
  console.log("Historic entries", entries);
  useEffect(() => {
    fetchHistoric();
  }, []);

  const filtered = entries.filter(
    (e) => filter === "tous" || e.status === filter,
  );

  const counts = {
    perime: entries.filter((e) => e.status === "perime").length,
    non_conforme: entries.filter((e) => e.status === "non_conforme").length,
    epuise: entries.filter((e) => e.status === "epuise").length,
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] pb-24 font-sans antialiased">
      <header className="bg-[#3E2723] text-white px-4 pt-8 pb-6 sticky top-0 z-10 shadow-md">
        <div>
          <h1 className="text-xl font-black tracking-tight text-[#FFF8E1]">
            Historique
          </h1>
          <p className="text-amber-200/60 text-xs mt-0.5 font-medium">
            Traçabilité complète des lots retirés
          </p>
        </div>
      </header>

      <div className="px-4 mt-5 grid grid-cols-3 gap-3">
        <div className="bg-white border border-red-100 rounded-2xl p-3 text-center">
          <p className="text-2xl font-black text-red-600">{counts.perime}</p>
          <p className="text-[10px] text-red-400 font-bold uppercase mt-0.5">
            Périmés
          </p>
        </div>
        <div className="bg-white border border-purple-100 rounded-2xl p-3 text-center">
          <p className="text-2xl font-black text-purple-600">
            {counts.non_conforme}
          </p>
          <p className="text-[10px] text-purple-400 font-bold uppercase mt-0.5">
            Non conformes
          </p>
        </div>
        <div className="bg-white border border-stone-200 rounded-2xl p-3 text-center">
          <p className="text-2xl font-black text-stone-500">{counts.epuise}</p>
          <p className="text-[10px] text-stone-400 font-bold uppercase mt-0.5">
            Épuisés
          </p>
        </div>
      </div>

      <div className="px-6 mt-4 flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 justify-center">
        {(["tous", "perime", "non_conforme", "epuise"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-all border
              ${
                filter === f
                  ? "bg-amber-800 text-[#FFF8E1] border-amber-900/20"
                  : "bg-white text-stone-500 border-stone-200"
              }`}
          >
            {f === "tous"
              ? "Tous"
              : f === "perime"
                ? "Périmés"
                : f === "non_conforme"
                  ? "Non conformes"
                  : "Épuisés"}
          </button>
        ))}
      </div>

      {/* Liste */}
      <div className="px-4 mt-4 flex flex-col gap-3">
        {loading ? (
          <div className="flex justify-center pt-12">
            <div className="w-5 h-5 border-2 border-amber-900/20 border-t-amber-900 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-amber-900/40 text-sm py-8 bg-white rounded-2xl border border-amber-900/10 font-medium">
            Aucune entrée dans l'historique.
          </p>
        ) : (
          filtered.map((entry) => {
            const style = STATUS_STYLE[entry.status] || STATUS_STYLE.epuise;
            const date = new Date(entry.created_at).toLocaleDateString(
              "fr-FR",
              {
                day: "numeric",
                month: "long",
                year: "numeric",
              },
            );
            return (
              <div
                key={entry.id}
                className="bg-white rounded-2xl p-4 border border-amber-900/10 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-bold text-[#3E2723] text-sm truncate">
                      {entry.type_name}
                    </p>
                    <p className="text-xs text-stone-400 mt-0.5">
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
                    className={`flex-shrink-0 text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${style.bg} ${style.text}`}
                  >
                    {style.label}
                  </span>
                </div>
                {entry.reason && (
                  <p className="mt-2 text-xs text-purple-700 bg-purple-50 rounded-lg px-3 py-1.5 font-medium">
                    Raison : {entry.reason}
                  </p>
                )}
                <p className="mt-2 text-[11px] text-stone-400 font-medium">
                  Archivé le {date}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
