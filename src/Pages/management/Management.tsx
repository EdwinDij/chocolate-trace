import { useEffect, useState } from "react";
import { supabase } from "../../utils/supabase";
import { chocolateList } from "../../utils/chocolateList";
import Toast from "../../components/Toast";
import { useToast } from "../../hooks/useToast";
import { ChocolateType } from "../../types/chocolateType";
import BarcodeScanner from "../../components/barcodeScanner/BarcodeScanner";

export default function Management() {
  const [chocolate, setChocolate] = useState<ChocolateType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [lifeWeeks, setLifeWeeks] = useState("");
  const [barcode, setBarcode] = useState("");
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [editName, setEditName] = useState("");
  // const [editLifeWeeks, setEditLifeWeeks] = useState(""); au cas ou si ça venait à arriver dans le futr
  const [editBarcode, setEditBarcode] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const { toast, showToast, hideToast } = useToast();

  useEffect(() => {
    fetchChocolateTypes();
  }, []);

  const fetchChocolateTypes = async () => {
    const { data, error } = await supabase
      .from("chocolate_type")
      .select("*")
      .order("name");
    if (!error) setChocolate(data || []);
    setLoading(false);
  };

  const addType = async (
    e: React.MouseEvent<HTMLButtonElement> | React.FormEvent,
  ) => {
    e.preventDefault();
    if (!name.trim() || !lifeWeeks) return;

    const { error } = await supabase.from("chocolate_type").insert({
      name: name.trim(),
      week_lifetime: parseInt(lifeWeeks),
      barcode: barcode.trim() || null,
    });

    if (error) {
      showToast("Erreur lors de l'ajout du type.", "error");
      return;
    }
    setName("");
    setLifeWeeks("");
    setShowForm(false);
    setBarcode("");
    fetchChocolateTypes();
    showToast("Type ajouté avec succès !");
  };

  async function deleteType(id: string) {
    console.log("Suppression du type avec ID :", id);
    const { error } = await supabase
      .from("chocolate_type")
      .delete()
      .eq("id", id);
    if (!error) {
      fetchChocolateTypes();
      showToast("Chocolat supprimé avec succès !");
    } else {
      showToast(
        "Erreur lors de la suppression du chocolat. Vérifiez votre dashboard",
      );
    }
  }

  const handleSelectChocolate = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedName = e.target.value;
    setName(selectedName);
    const found = chocolateList.find((c) => c.name === selectedName);
    if (found) setLifeWeeks(String(found.life_weeks));
    else setLifeWeeks("");
  };

  const handleBarcodeScan = (result: string) => {
    if (editingId) {
      setEditBarcode(result);
    } else {
      setBarcode(result);
    }
    setShowBarcodeScanner(false);
    showToast("Code-barres scanné !");
  };

  const startEdit = (type: ChocolateType) => {
    setEditingId(type.id);
    setEditName(type.name);
    setEditBarcode(type.barcode || "");
  };

  const saveEdit = async () => {
    if (!editName.trim()) return;
    const { error } = await supabase
      .from("chocolate_type")
      .update({
        name: editName.trim(),
        barcode: editBarcode.trim() || null,
      })
      .eq("id", editingId!);
    if (!error) {
      showToast("Chocolat mis à jour !");
      setEditingId(null);
      fetchChocolateTypes();
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] pb-24 font-sans antialiased">
      {/* Header en Cohérence avec Alertes */}
      <header className="bg-[#3E2723] text-white px-4 pt-8 pb-6 sticky top-0 z-10 shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black tracking-tight text-[#FFF8E1]">
              Catalogue
            </h1>
            <p className="text-amber-200/60 text-xs mt-0.5 font-medium">
              Gestion des recettes & durées de conservation
            </p>
          </div>
          <span className="text-[10px] bg-amber-700 text-[#FFF8E1] border border-amber-600 font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
            {chocolate.length} Référence{chocolate.length > 1 ? "s" : ""}
          </span>
        </div>
      </header>

      <div className="px-4 mt-5">
        {/* Bouton d'action Toggle Formulaire */}
        <button
          onClick={() => setShowForm(!showForm)}
          className={`w-full py-3 rounded-2xl font-bold text-sm tracking-wide transition-all duration-200 shadow-sm border flex items-center justify-center gap-2 active:scale-[0.98] ${
            showForm
              ? "bg-white text-stone-600 border-stone-200 hover:bg-stone-50"
              : "bg-amber-800 text-[#FFF8E1] border-amber-900/20 hover:bg-amber-900"
          }`}
        >
          {showForm ? (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
                stroke="currentColor"
                className="w-4 h-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18 18 6M6 6l12 12"
                />
              </svg>
              Annuler la saisie
            </>
          ) : (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
                stroke="currentColor"
                className="w-4 h-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4.5v15m7.5-7.5h-15"
                />
              </svg>
              Ajouter un chocolat
            </>
          )}
        </button>

        {/* Formulaire d'ajout style Carte Premium */}
        {showForm && (
          <div className="bg-white rounded-2xl p-4 mt-4 shadow-[0_4px_16px_-4px_rgba(62,39,35,0.08)] border border-amber-900/10 animate-fadeIn">
            <div className="mb-4">
              <label className="text-[11px] uppercase font-bold text-amber-900/50 tracking-wider mb-1.5 block">
                Nom du produit d'artisanat
              </label>
              <select
                value={name}
                onChange={handleSelectChocolate}
                className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm font-medium focus:outline-none focus:border-amber-700 bg-stone-50 text-stone-800 transition-all appearance-none shadow-inner"
                style={{
                  backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%2378716c' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'></polyline></svg>")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 12px center",
                  backgroundSize: "16px",
                }}
              >
                <option value="">Sélectionner dans le grimoire...</option>
                {chocolateList.map((choco) => (
                  <option key={choco.name} value={choco.name}>
                    {choco.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-5">
              <label className="text-[11px] uppercase font-bold text-amber-900/50 tracking-wider mb-1.5 block">
                Durée de fraîcheur optimale
              </label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={lifeWeeks ? `${lifeWeeks} semaines` : ""}
                  readOnly
                  placeholder="Sélection automatique"
                  className="w-full border border-stone-200/60 rounded-xl px-3 py-2.5 text-sm bg-stone-100/80 font-semibold text-stone-500 shadow-inner"
                />
              </div>
            </div>
            <div className="mb-4">
              <label className="text-sm text-stone-500 mb-1 block">
                Code-barres (optionnel)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  placeholder="ex. 2800118009449"
                  className="flex-1 border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-600"
                />
                <button
                  onClick={() => setShowBarcodeScanner(true)}
                  className="bg-amber-800 text-white px-3 rounded-lg text-lg"
                >
                  📷
                </button>
              </div>
            </div>

            {showBarcodeScanner && (
              <BarcodeScanner
                onScan={handleBarcodeScan}
                onClose={() => setShowBarcodeScanner(false)}
              />
            )}
            <button
              onClick={addType}
              disabled={!name}
              className="w-full bg-amber-700 text-[#FFF8E1] hover:bg-amber-800 disabled:opacity-40 disabled:hover:bg-amber-700 py-3 rounded-xl text-sm font-bold tracking-wide transition-all duration-150 shadow-sm active:scale-95"
            >
              Enregistrer au catalogue
            </button>
          </div>
        )}

        {/* Liste principale des types enregistrés */}
        <div className="mt-6">
          <h2 className="text-[11px] font-bold text-amber-900/40 uppercase tracking-wider mb-3 px-1">
            Produits enregistrés
          </h2>

          {loading ? (
            <div className="flex flex-col items-center justify-center pt-12 gap-2">
              <div className="w-5 h-5 border-2 border-amber-900/20 border-t-amber-900 rounded-full animate-spin" />
              <p className="text-center text-amber-900/40 text-xs font-medium">
                Lecture du catalogue...
              </p>
            </div>
          ) : chocolate.length === 0 ? (
            <p className="text-center text-amber-900/40 text-sm py-8 bg-white rounded-2xl border border-amber-900/10 shadow-sm font-medium">
              Le catalogue est vide pour le moment.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {chocolate.map((choco) => (
                <li
                  key={choco.id}
                  className="bg-white rounded-xl px-4 py-3 shadow-sm border border-stone-200"
                >
                  {editingId === choco.id ? (
                    // Mode édition
                    <div className="flex flex-col gap-2">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-600"
                        placeholder="Nom"
                      />
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={editBarcode}
                          onChange={(e) => setEditBarcode(e.target.value)}
                          className="flex-1 border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-600"
                          placeholder="Code-barres"
                        />
                        <button
                          onClick={() => setShowBarcodeScanner(true)}
                          className="bg-amber-800 text-white px-3 rounded-lg text-lg"
                        >
                          📷
                        </button>
                      </div>
                      <div className="flex gap-2 mt-1">
                        <button
                          onClick={saveEdit}
                          className="flex-1 bg-amber-800 text-white py-2 rounded-lg text-sm font-medium"
                        >
                          ✓ Sauvegarder
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="flex-1 bg-stone-100 text-stone-500 py-2 rounded-lg text-sm font-medium"
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Mode affichage
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-stone-800">
                          {choco.name}
                        </p>
                        <p className="text-xs text-stone-400 mt-0.5">
                          {choco.week_lifetime} sem. · retrait à{" "}
                          {choco.week_lifetime - 2} sem.
                          {choco.barcode && <span> · 📷 {choco.barcode}</span>}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => startEdit(choco)}
                          className="text-amber-600 hover:text-amber-800 text-lg px-1"
                          title="Modifier"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => deleteType(choco.id)}
                          className="text-red-400 hover:text-red-600 text-lg px-1"
                          title="Supprimer"
                        >
                          🗑
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
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
