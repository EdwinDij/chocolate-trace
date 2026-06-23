import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../../utils/supabase";
import Toast from "../../components/Toast";
import { useToast } from "../../hooks/useToast";
import { Product } from "../../types/productType";
import BarcodeScanner from "../../components/barcodeScanner/BarcodeScanner";
import { useShop } from "../../context/ShopContext";
import { usePlanGate } from "../../hooks/usePlanGate";
import BottomSheet from "../../components/BottomSheet";

function endOfWeekDate(weeks: number): string {
  const d = new Date();
  d.setDate(d.getDate() + weeks * 7);
  const day = d.getDay();
  if (day !== 0) d.setDate(d.getDate() + (7 - day));
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function Management() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [name, setName] = useState("");
  const [lifeWeeks, setLifeWeeks] = useState("");
  const [barcode, setBarcode] = useState("");
  const [category, setCategory] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editBarcode, setEditBarcode] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editLifeWeeks, setEditLifeWeeks] = useState("");

  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const { id } = useParams<{ id: string }>();
  const { shop } = useShop();
  const { canAddProduct } = usePlanGate();
  const shopId = id ?? shop?.id;

  const { toast, showToast, hideToast } = useToast();

  useEffect(() => {
    if (shopId) fetchProducts();
  }, [shopId]);

  const fetchProducts = async () => {
    if (!shopId) return;
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("shop_id", shopId)
      .order("name");
    if (!error) setProducts(data || []);
    setLoading(false);
  };

  const addProduct = async (e: React.MouseEvent<HTMLButtonElement> | React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !category.trim() || !shopId) return;
    if (!canAddProduct(products.length)) {
      showToast("Limite de 10 produits atteinte. Passez au plan Boutique pour en ajouter plus.", "error");
      return;
    }

    const { error } = await supabase.from("products").insert({
      name: name.trim(),
      category: category.trim(),
      week_lifetime: lifeWeeks ? parseInt(lifeWeeks) : null,
      barcode: barcode.trim() || null,
      shop_id: shopId,
    });

    if (error) {
      showToast("Erreur lors de l'ajout du produit.", "error");
      return;
    }
    setName("");
    setLifeWeeks("");
    setBarcode("");
    setCategory("");
    setShowForm(false);
    fetchProducts();
    showToast("Produit ajouté avec succès !");
  };

  const deleteProduct = async () => {
    if (!deleteTargetId) return;
    const { error } = await supabase.from("products").delete().eq("id", deleteTargetId);
    setDeleteTargetId(null);
    if (!error) {
      fetchProducts();
      showToast("Produit supprimé !");
    } else {
      showToast("Erreur lors de la suppression.", "error");
    }
  };

  const handleBarcodeScan = (result: string) => {
    if (editingId) setEditBarcode(result);
    else setBarcode(result);
    setShowBarcodeScanner(false);
    showToast("Code-barres scanné !");
  };

  const startEdit = (p: Product) => {
    setEditingId(p.id);
    setEditName(p.name);
    setEditBarcode(p.barcode || "");
    setEditCategory(p.category || "");
    setEditLifeWeeks(p.week_lifetime ? String(p.week_lifetime) : "");
  };

  const saveEdit = async () => {
    if (!editName.trim()) return;
    const { error } = await supabase
      .from("products")
      .update({
        name: editName.trim(),
        barcode: editBarcode.trim() || null,
        category: editCategory.trim() || null,
        week_lifetime: editLifeWeeks ? parseInt(editLifeWeeks) : null,
      })
      .eq("id", editingId!);
    if (!error) {
      showToast("Produit mis à jour !");
      setEditingId(null);
      fetchProducts();
    }
  };

  const grouped = products.reduce<Record<string, Product[]>>((acc, p) => {
    const key = p.category || "Sans catégorie";
    if (!acc[key]) acc[key] = [];
    acc[key].push(p);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-app pb-36 font-sans antialiased">
      <header className="bg-ink-800 text-white px-4 pt-8 pb-6 sticky top-0 z-10 shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black tracking-tight text-foam-100">Catalogue</h1>
            <p className="text-teal-300/60 text-xs mt-0.5 font-medium">
              {shop?.name} — Recettes & conservations
            </p>
          </div>
          <span className="text-[10px] bg-ink-800 text-foam-100 border border-teal-500 font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
            {products.length} Référence{products.length > 1 ? "s" : ""}
          </span>
        </div>
      </header>

      <div className="px-4 mt-5">
        <button
          onClick={() => setShowForm(!showForm)}
          className={`w-full py-3 rounded-2xl font-bold text-sm tracking-wide transition-all duration-200 shadow-sm border flex items-center justify-center gap-2 active:scale-[0.98] ${
            showForm
              ? "bg-card text-stone-600 border-stone-200 hover:bg-sunk"
              : "bg-ink-800 text-foam-100 border-amber-900/20 hover:bg-amber-900"
          }`}
        >
          {showForm ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
              Annuler
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Ajouter un produit
            </>
          )}
        </button>

        {showForm && (
          <div className="bg-card rounded-2xl p-4 mt-4 shadow-sm border border-slate-200">
            <div className="mb-4">
              <label className="text-[11px] uppercase font-bold text-amber-900/50 tracking-wider mb-1.5 block">
                Nom du produit
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ex. Saumon fumé, Ganache framboise..."
                className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm font-medium focus:outline-none focus:border-teal-500 bg-sunk placeholder-stone-400 shadow-inner"
              />
            </div>

            <div className="mb-4">
              <label className="text-[11px] uppercase font-bold text-amber-900/50 tracking-wider mb-1.5 block">
                Catégorie <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="ex. Chocolat, Confiserie, Viennoiserie..."
                required
                className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm font-medium focus:outline-none focus:border-teal-500 bg-sunk placeholder-stone-400 shadow-inner"
              />
            </div>

            <div className="mb-4">
              <label className="text-[11px] uppercase font-bold text-amber-900/50 tracking-wider mb-1.5 block">
                Durée de conservation (semaines)
              </label>
              <input
                type="number"
                value={lifeWeeks}
                onChange={(e) => setLifeWeeks(e.target.value)}
                placeholder="ex. 6"
                min={1}
                className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm font-medium focus:outline-none focus:border-teal-500 bg-sunk placeholder-stone-400 shadow-inner"
              />
              {lifeWeeks && parseInt(lifeWeeks) > 0 && (
                <p className="text-xs text-teal-600 font-medium mt-1 px-1">
                  → Fin de semaine estimée : {endOfWeekDate(parseInt(lifeWeeks))}
                </p>
              )}
            </div>

            <div className="mb-5">
              <label className="text-[11px] uppercase font-bold text-amber-900/50 tracking-wider mb-1.5 block">
                Code-barres (optionnel)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  placeholder="ex. 2800118009449"
                  className="flex-1 border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-500 bg-sunk shadow-inner"
                />
                <button
                  onClick={() => setShowBarcodeScanner(true)}
                  className="bg-ink-800 text-white px-3 rounded-xl text-lg"
                >
                  📷
                </button>
              </div>
            </div>

            <button
              onClick={addProduct}
              disabled={!name.trim() || !category.trim()}
              className="w-full bg-ink-800 text-foam-100 disabled:opacity-40 py-3 rounded-xl text-sm font-bold tracking-wide transition-all active:scale-95"
            >
              Enregistrer au catalogue
            </button>
          </div>
        )}

        <div className="mt-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center pt-12 gap-2">
              <div className="w-5 h-5 border-2 border-amber-900/20 border-t-amber-900 rounded-full animate-spin" />
              <p className="text-center text-amber-900/40 text-xs font-medium">Lecture du catalogue...</p>
            </div>
          ) : products.length === 0 ? (
            <p className="text-center text-amber-900/40 text-sm py-8 bg-card rounded-2xl border border-slate-200 shadow-sm font-medium">
              Le catalogue est vide pour le moment.
            </p>
          ) : (
            Object.entries(grouped).map(([cat, list]) => (
              <div key={cat} className="mb-5">
                <h2 className="text-[11px] font-bold text-amber-900/40 uppercase tracking-wider mb-2 px-1">
                  {cat} ({list.length})
                </h2>
                <ul className="flex flex-col gap-3">
                  {list.map((p) => (
                    <li key={p.id} className="bg-card rounded-xl px-4 py-3 shadow-sm border border-stone-200">
                      {editingId === p.id ? (
                        <div className="flex flex-col gap-2">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-teal-500"
                            placeholder="Nom"
                          />
                          <input
                            type="text"
                            value={editCategory}
                            onChange={(e) => setEditCategory(e.target.value)}
                            className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-teal-500"
                            placeholder="Catégorie"
                          />
                          <input
                            type="number"
                            value={editLifeWeeks}
                            onChange={(e) => setEditLifeWeeks(e.target.value)}
                            className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-teal-500"
                            placeholder="Durée de conservation (semaines)"
                            min={1}
                          />
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={editBarcode}
                              onChange={(e) => setEditBarcode(e.target.value)}
                              className="flex-1 border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-teal-500"
                              placeholder="Code-barres"
                            />
                            <button
                              onClick={() => setShowBarcodeScanner(true)}
                              className="bg-ink-800 text-white px-3 rounded-xl text-lg"
                            >
                              📷
                            </button>
                          </div>
                          <div className="flex gap-2 mt-1">
                            <button onClick={saveEdit} className="flex-1 bg-ink-800 text-white py-2 rounded-xl text-sm font-medium">
                              ✓ Sauvegarder
                            </button>
                            <button onClick={() => setEditingId(null)} className="flex-1 bg-stone-100 text-slate-500 py-2 rounded-xl text-sm font-medium">
                              Annuler
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-800 text-sm truncate">{p.name}</p>
                            <div className="flex flex-wrap gap-x-3 mt-0.5">
                              {p.week_lifetime && (
                                <p className="text-xs text-slate-400">
                                  Conservation : {p.week_lifetime} sem.
                                </p>
                              )}
                              {p.barcode && (
                                <p className="text-xs text-slate-400">📷 {p.barcode}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button onClick={() => startEdit(p)} className="text-amber-600 hover:text-teal-700 text-lg px-1">✏️</button>
                            <button onClick={() => setDeleteTargetId(p.id)} className="text-red-400 hover:text-red-600 text-lg px-1">🗑</button>
                          </div>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </div>
      </div>

      {showBarcodeScanner && (
        <BarcodeScanner onScan={handleBarcodeScan} onClose={() => setShowBarcodeScanner(false)} />
      )}

      <BottomSheet
        open={!!deleteTargetId}
        title="Supprimer ce produit ?"
        description="Il sera retiré du catalogue. Les lots existants ne sont pas affectés."
        confirmLabel="Supprimer"
        confirmVariant="danger"
        onConfirm={deleteProduct}
        onCancel={() => setDeleteTargetId(null)}
      />

      <div className="px-4 mt-8 pb-2">
        <p className="text-center text-[10px] text-amber-900/30 font-medium">© 2026 Edwin Dijeont</p>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
    </div>
  );
}
