import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../../utils/supabase";
import { useShop } from "../../context/ShopContext";
import Toast from "../../components/Toast";
import { useToast } from "../../hooks/useToast";
import { X } from "lucide-react";

interface Member {
  id: string;
  user_id: string;
  role: "gerant" | "responsable" | "employe";
  display_name: string | null;
}

const ROLE_ORDER = { gerant: 0, responsable: 1, employe: 2 };

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function avatarBg(role: string) {
  if (role === "gerant") return "bg-amber-100 text-amber-800";
  if (role === "responsable") return "bg-teal-100 text-teal-700";
  return "bg-slate-100 text-slate-500";
}

function roleBadge(role: string) {
  if (role === "gerant")
    return { label: "Gérant", cls: "bg-amber-50 text-amber-700 border-amber-200" };
  if (role === "responsable")
    return { label: "Responsable", cls: "bg-teal-50 text-teal-700 border-teal-200" };
  return { label: "Employé", cls: "bg-slate-50 text-slate-500 border-slate-200" };
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
  const [promoting, setPromoting] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);

  const isGerant = currentMember?.role === "gerant";
  const canManage = isGerant || currentMember?.role === "responsable";

  useEffect(() => {
    if (shopId) fetchMembers();
  }, [shopId]);

  const fetchMembers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("shop_member")
      .select("id, user_id, role, display_name")
      .eq("shop_id", shopId);

    const sort = (list: Member[]) =>
      list.sort(
        (a, b) =>
          ROLE_ORDER[a.role as keyof typeof ROLE_ORDER] -
          ROLE_ORDER[b.role as keyof typeof ROLE_ORDER],
      );

    if (!error) {
      setMembers(sort(data || []));
    } else {
      const { data: fallback } = await supabase
        .from("shop_member")
        .select("id, user_id, role")
        .eq("shop_id", shopId);
      setMembers(sort((fallback || []) as Member[]));
    }
    setLoading(false);
  };

  const promoteToResponsable = async (memberId: string) => {
    setPromoting(memberId);
    const { error } = await supabase
      .from("shop_member")
      .update({ role: "responsable" })
      .eq("id", memberId);
    if (!error) {
      showToast("Promu responsable !");
      fetchMembers();
    } else {
      showToast("Erreur lors de la promotion", "error");
    }
    setPromoting(null);
  };

  const removeMember = async (memberId: string) => {
    setRemoving(memberId);
    const { error } = await supabase
      .from("shop_member")
      .delete()
      .eq("id", memberId);
    if (!error) {
      showToast("Membre retiré de l'équipe");
      fetchMembers();
    } else {
      showToast("Erreur lors de la suppression", "error");
    }
    setRemoving(null);
    setConfirmRemove(null);
  };

  const canRemoveMember = (m: Member): boolean => {
    if (m.user_id === currentMember?.user_id) return false;
    if (m.role === "gerant") return false;
    if (isGerant) return true;
    if (currentMember?.role === "responsable" && m.role === "employe") return true;
    return false;
  };

  const generateInviteLink = async () => {
    if (!shopId) return;
    setGeneratingLink(true);
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const { error } = await supabase.from("invitations").insert({
      shop_id: shopId,
      token,
      role: "employe",
      expires_at: expiresAt,
    });

    if (!error) {
      setInviteLink(`${window.location.origin}/invite/${token}`);
    } else {
      showToast("Erreur lors de la génération du lien", "error");
    }
    setGeneratingLink(false);
  };

  const copyLink = () => {
    if (!inviteLink) return;
    navigator.clipboard.writeText(inviteLink).then(() => {
      showToast("Lien copié !");
    });
  };

  const gerants = members.filter((m) => m.role === "gerant");
  const responsables = members.filter((m) => m.role === "responsable");
  const employes = members.filter((m) => m.role === "employe");

  const MemberCard = ({ m }: { m: Member }) => {
    const name = m.display_name ?? `Membre ${m.user_id.slice(0, 8)}`;
    const badge = roleBadge(m.role);
    const isEmployee = m.role === "employe";
    const showConfirm = confirmRemove === m.id;

    return (
      <li className="bg-card rounded-2xl px-4 py-3.5 shadow-sm border border-stone-200 flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black shrink-0 ${avatarBg(m.role)}`}
        >
          {initials(name)}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-bold text-[#3E2723] text-sm truncate">{name}</p>
          <span
            className={`inline-block mt-0.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${badge.cls}`}
          >
            {badge.label}
          </span>
        </div>

        {showConfirm ? (
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setConfirmRemove(null)}
              className="text-xs text-slate-400 font-medium hover:text-slate-600 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={() => removeMember(m.id)}
              disabled={removing === m.id}
              className="text-xs font-bold text-white bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded-xl active:scale-95 transition-all disabled:opacity-50"
            >
              {removing === m.id ? "..." : "Confirmer"}
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 shrink-0">
            {canManage && isEmployee && (
              <button
                onClick={() => promoteToResponsable(m.id)}
                disabled={promoting === m.id}
                className="text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-200 px-3 py-1.5 rounded-xl active:scale-95 transition-all disabled:opacity-50"
              >
                {promoting === m.id ? "..." : "Promouvoir"}
              </button>
            )}
            {canRemoveMember(m) && (
              <button
                onClick={() => setConfirmRemove(m.id)}
                className="w-8 h-8 flex items-center justify-center rounded-xl bg-red-50 border border-red-200 text-red-400 hover:text-red-600 hover:bg-red-100 active:scale-95 transition-all"
                title="Retirer de l'équipe"
              >
                <X size={14} />
              </button>
            )}
          </div>
        )}
      </li>
    );
  };

  const Section = ({ title, list }: { title: string; list: Member[] }) => {
    if (list.length === 0) return null;
    return (
      <div className="mb-5">
        <h2 className="text-[11px] font-bold text-amber-900/40 uppercase tracking-wider mb-2 px-1">
          {title} ({list.length})
        </h2>
        <ul className="flex flex-col gap-2">
          {list.map((m) => (
            <MemberCard key={m.id} m={m} />
          ))}
        </ul>
      </div>
    );
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
              {shop?.name} — {members.length} membre{members.length > 1 ? "s" : ""}
            </p>
          </div>
          {isGerant && (
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
        {canManage && (
          <div className="bg-card rounded-2xl p-4 border border-slate-200 shadow-sm mb-6">
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
          <>
            <Section title="Direction" list={gerants} />
            <Section title="Responsables" list={responsables} />
            <Section title="Employés" list={employes} />
          </>
        )}
      </div>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}
    </div>
  );
}
