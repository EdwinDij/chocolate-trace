import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../utils/supabase";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Store,
  ShieldCheck,
  ChevronDown,
} from "lucide-react";

type Tab = "connexion" | "inscription";

const allWorks = [
  "Crémerie",
  "Charcuterie",
  "Traiteur",
  "Boulangerie",
  "Pâtisserie",
  "Conserverie",
  "Chocolaterie",
  "Poissonnerie",
  "Autre",
];

export default function Auth() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("connexion");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [shop, setShop] = useState<string>("");
  const [work, setWork] = useState<string>("");
  const [remember, setRemember] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
      options: {
        ...(remember && { expiresIn: 60 * 60 * 24 * 30 }),
      },
    } as any);
    if (error) {
      setError("Email ou mot de passe incorrect.");
      return;
    }

    navigate("/");
  };

  const handleSignUp = async () => {
    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }

    const displayName = `${firstName.trim()} ${lastName.trim()}`.trim();

    //créer l'utilisateur dans Supabase
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    });

    if (signUpError || !data.user) {
      setError("Une erreur est survenue lors de l'inscription.");
      return;
    }

    const userId = data.user.id;
    //créer la boutique
    const { data: shopData, error: shopError } = await supabase
      .from("shops")
      .insert({
        name: shop,
        work: work,
        plan: "gratuit",
        owner_id: userId,
      })
      .select()
      .single();

    if (shopError || !shopData) {
      setError("Erreur lors de la création de la boutique.");
      return;
    }

    // créer le profile gérant
    const { error: memberError } = await supabase.from("shop_member").insert({
      user_id: userId,
      shop_id: shopData.id,
      role: "gerant",
      display_name: displayName || null,
    });

    if (memberError) {
      setError("Erreur lors de la création du profil gérant.");
      return;
    }
    navigate("/");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (tab === "connexion") {
      await handleSignIn();
    } else {
      await handleSignUp();
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-ink-800 flex flex-col">
      {/* Header */}
      <div className="flex flex-col items-center pt-16 pb-10 px-4">
        <div className="w-14 h-14 bg-teal-900 border border-teal-700 rounded-2xl flex items-center justify-center mb-4">
          <span className="text-teal-300 text-2xl font-black">T.</span>
        </div>
        <h1 className="text-white text-2xl font-black tracking-tight">
          Tracéo
        </h1>
        <p className="text-teal-300/60 text-sm mt-1">
          La traçabilité des métiers de bouche
        </p>
      </div>

      <div className="flex-1 bg-card rounded-t-3xl px-4 pt-8 pb-10">
        <div className="flex bg-slate-100 rounded-xl p-1 mb-8">
          {(["connexion", "inscription"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => {
                setTab(t);
                setError(null);
              }}
              className={`flex-1 py-2.5 rounded-[10px] text-sm font-bold transition-all ${
                tab === t ? "bg-card text-ink-900 shadow-sm" : "text-slate-400"
              }`}
            >
              {t === "connexion" ? "Connexion" : "Inscription"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Champs inscription uniquement */}
          {tab === "inscription" && (
            <>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-micro font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">
                    Prénom
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="ex. Marie"
                    required
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm bg-sunk text-slate-800 placeholder-slate-300 focus:outline-none focus:border-teal-500 transition-colors"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-micro font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">
                    Nom
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="ex. Dupont"
                    required
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm bg-sunk text-slate-800 placeholder-slate-300 focus:outline-none focus:border-teal-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="text-micro font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">
                  Nom de l'établissement
                </label>
                <div className="flex items-center border border-slate-200 rounded-xl px-4 py-3 gap-3 bg-sunk focus-within:border-teal-500 transition-colors">
                  <Store size={16} className="text-slate-400 shrink-0" />
                  <input
                    type="text"
                    value={shop}
                    onChange={(e) => setShop(e.target.value)}
                    placeholder="ex. Fromagerie du Marché"
                    required
                    className="flex-1 text-sm text-slate-800 placeholder-slate-300 focus:outline-none bg-transparent"
                  />
                </div>
              </div>

              {/* Métier */}
              <div>
                <label className="text-micro font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">
                  Votre métier
                </label>
                <div className="relative">
                  <select
                    value={work}
                    onChange={(e) => setWork(e.target.value)}
                    required
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm bg-sunk text-slate-800 focus:outline-none focus:border-teal-500 transition-colors appearance-none pr-10"
                  >
                    <option value="">Sélectionner un métier...</option>
                    {allWorks.map((w) => (
                      <option key={w} value={w.toLowerCase()}>
                        {w}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={16}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="text-micro font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">
              E-mail professionnel
            </label>
            <div className="flex items-center border border-slate-200 rounded-xl px-4 py-3 gap-3 bg-sunk focus-within:border-teal-500 transition-colors">
              <Mail size={16} className="text-slate-400 shrink-0" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@etablissement.fr"
                required
                className="flex-1 text-sm text-slate-800 placeholder-slate-300 focus:outline-none bg-transparent"
              />
            </div>
          </div>

          <div>
            <label className="text-micro font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">
              Mot de passe
            </label>
            <div className="flex items-center border border-slate-200 rounded-xl px-4 py-3 gap-3 bg-sunk focus-within:border-teal-500 transition-colors">
              <Lock size={16} className="text-slate-400 shrink-0" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={
                  tab === "inscription"
                    ? "8 caractères minimum"
                    : "Votre mot de passe"
                }
                required
                className="flex-1 text-sm text-slate-800 placeholder-slate-300 focus:outline-none bg-transparent"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {tab === "connexion" && (
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="w-4 h-4 rounded accent-ink-800"
                />
                <span className="text-sm text-slate-600">Se souvenir</span>
              </label>
              <button
                type="button"
                className="text-sm font-bold text-teal-600 hover:text-teal-700 transition-colors"
              >
                Mot de passe oublié ?
              </button>
            </div>
          )}

          {tab === "inscription" && (
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                required
                className="w-4 h-4 mt-0.5 rounded accent-ink-800 shrink-0"
              />
              <span className="text-sm text-slate-600 leading-snug">
                J&apos;accepte les{" "}
                <a
                  href="https://landingpagetraceo.vercel.app/cgv"
                  className="font-bold text-teal-600 hover:text-teal-700"
                >
                  conditions d&apos;utilisation
                </a>{" "}
                et la{" "}
                <a
                  href="https://landingpagetraceo.vercel.app/confidentialites"
                  className="font-bold text-teal-600 hover:text-teal-700"
                >
                  politique de confidentialité
                </a>
              </span>
            </label>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600 font-medium">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-ink-800 hover:bg-ink-900 disabled:opacity-50 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors active:scale-95 mt-2"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                {tab === "connexion" ? "Se connecter" : "Créer mon compte"}
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
