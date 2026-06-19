import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../utils/supabase";

interface Invitation {
  id: string;
  shop_id: string;
  token: string;
  role: string;
  expires_at: string;
  used_at: string | null;
}

export default function InvitePage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [status, setStatus] = useState<"loading" | "valid" | "invalid" | "success">("loading");
  const [firstName, setFirstName] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    verifyToken();
  }, [token]);

  const verifyToken = async () => {
    if (!token) {
      setStatus("invalid");
      return;
    }
    const { data, error } = await supabase
      .from("invitations")
      .select("*")
      .eq("token", token)
      .single();

    if (error || !data) {
      setStatus("invalid");
      return;
    }

    if (data.used_at) {
      setStatus("invalid");
      return;
    }

    if (new Date(data.expires_at) < new Date()) {
      setStatus("invalid");
      return;
    }

    setInvitation(data);
    setStatus("valid");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || password.length < 8 || !invitation) return;
    setSubmitting(true);
    setError(null);

    const email = `${token}@traceo.app`;

    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: firstName.trim() },
      },
    });

    if (signUpError || !authData.user) {
      setError("Erreur lors de la création du compte.");
      setSubmitting(false);
      return;
    }

    const userId = authData.user.id;

    const { error: memberError } = await supabase.from("shop_member").insert({
      user_id: userId,
      shop_id: invitation.shop_id,
      role: invitation.role ?? "employe",
    });

    if (memberError) {
      setError(`Erreur lors de l'ajout au magasin : ${memberError.message}`);
      setSubmitting(false);
      return;
    }

    await supabase
      .from("invitations")
      .update({ used_at: new Date().toISOString() })
      .eq("id", invitation.id);

    setStatus("success");
    setTimeout(() => navigate("/auth"), 2500);
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-app flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-amber-900/20 border-t-amber-900 rounded-full animate-spin" />
          <p className="text-amber-900/40 text-sm font-medium">Vérification du lien...</p>
        </div>
      </div>
    );
  }

  if (status === "invalid") {
    return (
      <div className="min-h-screen bg-app flex items-center justify-center px-6">
        <div className="bg-card rounded-2xl p-8 border border-red-100 shadow-sm text-center max-w-sm w-full">
          <span className="text-3xl">⛔</span>
          <h1 className="text-lg font-black text-[#3E2723] mt-3">
            Lien invalide
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Ce lien d'invitation est expiré, déjà utilisé ou incorrect.
          </p>
          <button
            onClick={() => navigate("/auth")}
            className="mt-5 w-full bg-ink-800 text-foam-100 py-2.5 rounded-xl text-sm font-bold"
          >
            Aller à la connexion
          </button>
        </div>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="min-h-screen bg-app flex items-center justify-center px-6">
        <div className="bg-card rounded-2xl p-8 border border-teal-100 shadow-sm text-center max-w-sm w-full">
          <span className="text-3xl">✅</span>
          <h1 className="text-lg font-black text-[#3E2723] mt-3">
            Compte créé !
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Tu vas être redirigé vers la connexion...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app flex items-center justify-center px-6">
      <div className="bg-card rounded-2xl p-6 border border-slate-200 shadow-sm w-full max-w-sm">
        <div className="text-center mb-6">
          <span className="text-3xl">👋</span>
          <h1 className="text-lg font-black text-[#3E2723] mt-2">
            Rejoindre la boutique
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Crée ton accès en quelques secondes
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-[11px] uppercase font-bold text-amber-900/50 tracking-wider mb-1 block">
              Prénom
            </label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="ex. Marie"
              className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm font-medium focus:outline-none focus:border-teal-500 bg-sunk placeholder-stone-400 shadow-inner"
              required
            />
          </div>

          <div>
            <label className="text-[11px] uppercase font-bold text-amber-900/50 tracking-wider mb-1 block">
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="8 caractères minimum"
              className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm font-medium focus:outline-none focus:border-teal-500 bg-sunk placeholder-stone-400 shadow-inner"
              minLength={8}
              required
            />
          </div>

          {error && (
            <p className="text-xs text-red-500 font-medium bg-red-50 px-3 py-2 rounded-xl border border-red-100">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={
              submitting || !firstName.trim() || password.length < 8
            }
            className="w-full bg-ink-800 text-foam-100 py-3 rounded-xl text-sm font-bold tracking-wide active:scale-95 transition-all disabled:opacity-40 mt-1"
          >
            {submitting ? "Création..." : "Créer mon accès"}
          </button>
        </form>
      </div>
    </div>
  );
}
