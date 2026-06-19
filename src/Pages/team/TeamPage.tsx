import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../../utils/supabase";
import { useShop } from "../../context/ShopContext";
import Toast from "../../components/Toast";
import { useToast } from "../../hooks/useToast";

interface Member {
  id: string;
  user_id: string;
  role: "gerant" | "responsable" | "employe";
}

export default function TeamPage() {
  const { id } = useParams<{ id: string }>();
  const { shop, member: currentMember } = useShop();
  const shopId = id ?? shop?.id;
  const { toast, showToast, hideToast } = useToast();

  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [generatingLink, setGeneratingLink] = useState(false);

  const canManage =
    currentMember?.role === "gerant" ||
    currentMember?.role === "responsable";

  useEffect(() => {
    if (shopId) fetchMembers();
  }, [shopId]);

  const fetchMembers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("shop_member")
      .select("id, user_id, role")
      .eq("shop_id", shopId);
    if (!error) setMembers(data || []);
    setLoading(false);
  };

  const changeRole = async (
    memberId: string,
    currentRole: "responsable" | "employe",
  ) => {
    const newRole = currentRole === "responsable" ? "employe" : "responsable";
    const { error } = await supabase
      .from("shop_member")
      .update({ role: newRole })
      .eq("id", memberId);
    if (!error) {
      showToast(`Rôle changé en ${newRole}`);
      fetchMembers();
    } else {
      showToast("Erreur lors du changement de rôle", "error");
    }
  };

  const generateInviteLink = async () => {
    if (!shopId) return;
    setGeneratingLink(true);
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const { error } = await supabase.from("invitations").insert({
      shop_id: shopId,
      token,
      expires_at: expiresAt,
    });

    if (!error) {
      const link = `${window.location.origin}/invite/${token}`;
      setInviteLink(link);
    } else {
      showToast("Erreur lors de la génération du lien", "error");
    }
    setGeneratingLink(false);
  };

  const copyLink = () => {
    if (!inviteLink) return;
    navigator.clipboard.writeText(inviteLink).then(() => {
      showToast("Lien copié dans le presse-papier !");
    });
  };

  const roleLabel = (role: string) => {
    if (role === "gerant") return "Gérant";
    if (role === "responsable") return "Responsable";
    return "Employé";
  };

  const roleStyle = (role: string) => {
    if (role === "gerant")
      return "bg-amber-100 text-amber-800 border-amber-200";
    if (role === "responsable")
      return "bg-teal-100 text-teal-800 border-teal-200";
    return "bg-slate-100 text-slate-600 border-slate-200";
  };

  return (
    <div className="min-h-screen bg-app pb-24 font-sans antialiased">
      <header className="bg-ink-800 text-white px-4 pt-8 pb-6 sticky top-0 z-10 shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black tracking-tight text-foam-100">
              Équipe
            </h1>
            <p className="text-teal-300/60 text-xs mt-0.5 font-medium">
              {shop?.name} — Membres & permissions
            </p>
          </div>
          {currentMember?.role === "gerant" && (
            <Link
              to="/boutique"
              className="text-[10px] bg-ink-800 text-foam-100 border border-teal-500 font-bold px-2.5 py-1 rounded-full uppercase tracking-wider"
            >
              Mes boutiques
            </Link>
          )}
        </div>
      </header>

      <div className="px-4 mt-5">
        {/* Génération du lien d'invitation */}
        {canManage && (
          <div className="bg-card rounded-2xl p-4 border border-slate-200 shadow-sm mb-5">
            <p className="text-[11px] uppercase font-bold text-amber-900/50 tracking-wider mb-3">
              Inviter un employé
            </p>

            {inviteLink ? (
              <div className="flex flex-col gap-2">
                <p className="text-xs text-slate-500 break-all bg-sunk rounded-xl px-3 py-2 font-mono border border-stone-200">
                  {inviteLink}
                </p>
                <button
                  onClick={copyLink}
                  className="w-full bg-ink-800 text-foam-100 py-2.5 rounded-xl text-sm font-bold tracking-wide active:scale-95 transition-all"
                >
                  Copier le lien
                </button>
                <button
                  onClick={() => setInviteLink(null)}
                  className="w-full bg-card text-slate-500 border border-stone-200 py-2 rounded-xl text-xs font-medium"
                >
                  Générer un nouveau lien
                </button>
              </div>
            ) : (
              <button
                onClick={generateInviteLink}
                disabled={generatingLink}
                className="w-full bg-ink-800 text-foam-100 py-2.5 rounded-xl text-sm font-bold tracking-wide active:scale-95 transition-all disabled:opacity-50"
              >
                {generatingLink ? "Génération..." : "Générer un lien d'invitation"}
              </button>
            )}
          </div>
        )}

        {/* Liste des membres */}
        <h2 className="text-[11px] font-bold text-amber-900/40 uppercase tracking-wider mb-3 px-1">
          Membres ({members.length})
        </h2>

        {loading ? (
          <div className="flex flex-col items-center justify-center pt-12 gap-2">
            <div className="w-5 h-5 border-2 border-amber-900/20 border-t-amber-900 rounded-full animate-spin" />
            <p className="text-center text-amber-900/40 text-xs font-medium">
              Chargement...
            </p>
          </div>
        ) : members.length === 0 ? (
          <p className="text-center text-amber-900/40 text-sm py-8 bg-card rounded-2xl border border-slate-200 shadow-sm font-medium">
            Aucun membre dans cette boutique.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {members.map((m) => (
              <li
                key={m.id}
                className="bg-card rounded-2xl px-4 py-3 shadow-sm border border-stone-200 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="font-bold text-[#3E2723] text-sm truncate">
                    Membre {m.user_id.slice(0, 8)}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${roleStyle(m.role)}`}
                  >
                    {roleLabel(m.role)}
                  </span>

                  {canManage &&
                    m.role !== "gerant" && (
                      <button
                        onClick={() =>
                          changeRole(
                            m.id,
                            m.role as "responsable" | "employe",
                          )
                        }
                        className="text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-xl hover:bg-teal-100 active:scale-95 transition-all"
                      >
                        {m.role === "responsable"
                          ? "→ Employé"
                          : "→ Responsable"}
                      </button>
                    )}
                </div>
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
