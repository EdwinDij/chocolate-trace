import { useEffect, useState } from "react";
import { supabase } from "../../utils/supabase";

import Toast from "../../components/Toast";
import { useToast } from "../../hooks/useToast";

interface ChocolateType {
  id: string;
  name: string;
  week_lifetime: number;
  created_at: string;
}

interface Chocolate {
  name: string;
  life_weeks: number;
}
const life_weeks_ganache = 5;
const life_weeks_praline = 6;
const chocolateList: Chocolate[] = [
  // ── GANACHES (durée de vie : 5 semaines) ──────────────────
  { name: "Citron Noir", life_weeks: life_weeks_ganache },
  { name: "Poivre Noir", life_weeks: life_weeks_ganache },
  { name: "Origine République Dominicaine", life_weeks: life_weeks_ganache },
  { name: "Origine Madagascar", life_weeks: life_weeks_ganache },
  { name: "Origine Venezuela", life_weeks: life_weeks_ganache },
  { name: "Coco Noir", life_weeks: life_weeks_ganache },
  { name: "Thé Earl Grey", life_weeks: life_weeks_ganache },
  { name: "Passion Lait", life_weeks: life_weeks_ganache },
  { name: "Palet Or Noir", life_weeks: life_weeks_ganache },
  { name: "Palet Moka Noir", life_weeks: life_weeks_ganache },
  { name: "Mokamande Noir", life_weeks: life_weeks_ganache },
  { name: "Palet Or Lait", life_weeks: life_weeks_ganache },
  { name: "Palet Guérande", life_weeks: life_weeks_ganache },
  { name: "Mokamande Lait", life_weeks: life_weeks_ganache },
  { name: "Caramel", life_weeks: life_weeks_ganache },
  { name: "Palet Mère de Famille", life_weeks: life_weeks_ganache },

  // ── PRALINÉS (durée de vie : 6 semaines) ──────────────────
  { name: "Pavé de Tours Noir", life_weeks: life_weeks_praline },
  { name: "Pavé de Tours Lait", life_weeks: life_weeks_praline },
  { name: "Praliné Café Noir", life_weeks: life_weeks_praline },
  { name: "Praliné Café Lait", life_weeks: life_weeks_praline },
  { name: "Praliné Amande Noir", life_weeks: life_weeks_praline },
  { name: "Praliné Amande Lait", life_weeks: life_weeks_praline },
  { name: "Praliné À l'Ancienne Noir", life_weeks: life_weeks_praline },
  { name: "Praliné À l'Ancienne Lait", life_weeks: life_weeks_praline },
  { name: "Praliné Noisette Noir", life_weeks: life_weeks_praline },
  { name: "Praliné Noisette Lait", life_weeks: life_weeks_praline },
  { name: "Praliné Pistache Noir", life_weeks: life_weeks_praline },
  { name: "Praliné Pistache Lait", life_weeks: life_weeks_praline },
  { name: "Praliné Sésame Noir", life_weeks: life_weeks_praline },
  { name: "Praliné Sésame Lait", life_weeks: life_weeks_praline },
  { name: "Rocher Praliné Noir", life_weeks: life_weeks_praline },
  { name: "Rocher Praliné Lait", life_weeks: life_weeks_praline },
  { name: "Chiaracrousti Noir", life_weeks: life_weeks_praline },
  { name: "Chiaracrousti Lait", life_weeks: life_weeks_praline },
  { name: "Amanda", life_weeks: life_weeks_praline },
  { name: "Palet du Faubourg Noir", life_weeks: life_weeks_praline },
  { name: "Palet du Faubourg Lait", life_weeks: life_weeks_praline },
  { name: "Praliné Amande Noisette Noir", life_weeks: life_weeks_praline },
  { name: "Praliné Amande Noisette Lait", life_weeks: life_weeks_praline },

  // ── PÂTES D'AMANDES ───────────────────────────────────────
  { name: "Pâte d'Amandes Pistache Noir", life_weeks: life_weeks_praline },
  { name: "Pâte d'Amandes Pistache Lait", life_weeks: life_weeks_praline },
  { name: "Pâte d'Amandes Noix", life_weeks: life_weeks_praline },
];

export default function Management() {
  const [chocolate, setChocolate] = useState<ChocolateType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [lifeWeeks, setLifeWeeks] = useState("");

  const { toast, showToast, hideToast } = useToast();

  useEffect(() => {
    fetchTypes();
  }, []);

  const fetchTypes = async () => {
    const { data, error } = await supabase
      .from("chocolate_type")
      .select("*")
      .order("name");
    if (!error) setChocolate(data || []);
    setLoading(false);
  };

  const addType = async (e: React.FormEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!name.trim() || !lifeWeeks) return;

    const { error } = await supabase
      .from("chocolate_type")
      .insert({ name: name.trim(), week_lifetime: parseInt(lifeWeeks) });

    if (error) {
      showToast("Erreur lors de l'ajout du type.", "error");
      return;
    }
    console.log("Type ajouté:", name, lifeWeeks);
    setName("");
    setLifeWeeks("");
    fetchTypes();
    showToast("Type ajouté avec succès !");
  };

  async function deleteType(id: string) {
    const { error } = await supabase
      .from("chocolate_type")
      .delete()
      .eq("id", id);
    if (!error) {
      fetchTypes();
      showToast("Chocolat supprimé avec succès !");
    }
  }
  const handleSelectChocolate = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedName = e.target.value;
    setName(selectedName);
    const found = chocolateList.find((c) => c.name === selectedName);
    if (found) setLifeWeeks(String(found.life_weeks));
    else setLifeWeeks("");
  };
  return (
    <div className="min-h-screen bg-stone-50 pb-24">
      <div className="bg-amber-800 text-white px-4 pt-10 pb-6">
        <h1 className="text-xl font-bold">Gérer</h1>
        <p className="text-amber-200 text-sm mt-1">Types de chocolat</p>
      </div>
      <div className="px-4 mt-6">
        <button
          onClick={() => setShowForm(!showForm)}
          className="w-full bg-amber-800 text-white py-3 rounded-xl font-medium mb-4 flex items-center justify-center gap-2"
        >
          <span>{showForm ? "✕ Annuler" : "+ Nouveau type"}</span>
        </button>

        {showForm && (
          <div className="bg-white rounded-xl p-4 mb-4 shadow-sm border border-stone-200">
            <div className="mb-3">
              <label className="text-sm text-stone-500 mb-1 block">
                Nom du chocolat
              </label>

              <select
                value={name}
                onChange={handleSelectChocolate}
                className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-600 bg-white"
              >
                <option value="">Choisir un chocolat...</option>
                {chocolateList.map((choco) => (
                  <option key={choco.name} value={choco.name}>
                    {choco.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="mb-4">
              <label className="text-sm text-stone-500 mb-1 block">
                Durée de vie (semaines)
              </label>
              <input
                type="number"
                value={lifeWeeks}
                onChange={(e) => setLifeWeeks(e.target.value)}
                readOnly
                className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm bg-stone-50 text-stone-500"
              />
            </div>
            <button
              onClick={addType}
              className="w-full bg-amber-700 text-white py-2 rounded-lg text-sm font-medium"
            >
              Enregistrer
            </button>
          </div>
        )}

        {/* Liste des types */}
        {loading ? (
          <p className="text-center text-stone-400 text-sm mt-8">
            Chargement...
          </p>
        ) : chocolate.length === 0 ? (
          <p className="text-center text-stone-400 text-sm mt-8">
            Aucun type de chocolat — commence par en ajouter un.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {chocolate.map((choco) => (
              <li
                key={choco.id}
                className="bg-white rounded-xl px-4 py-3 shadow-sm border border-stone-200 flex items-center justify-between"
              >
                <div>
                  <p className="font-medium text-stone-800">{choco.name}</p>
                  <p className="text-xs text-stone-400 mt-0.5">
                    Durée de vie : {choco.week_lifetime} semaines · retrait à{" "}
                    {choco.week_lifetime - 2} sem.
                  </p>
                </div>
                <button
                  onClick={() => deleteType(choco.id)}
                  className="text-red-400 hover:text-red-600 text-lg px-2"
                  title="Supprimer"
                >
                  🗑
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}
    </div>
  );
}
