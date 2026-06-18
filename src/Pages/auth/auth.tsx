import { useState } from "react";
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

const METIERS = [
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
  const [tab, setTab] = useState<Tab>("connexion");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [boutique, setBoutique] = useState("");
  const [metier, setMetier] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: brancher Supabase Auth
    console.log({ tab, email, password, remember, boutique, metier });
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

      {/* Card */}
      <div className="flex-1 bg-white rounded-t-3xl px-4 pt-8 pb-10">
        {/* Toggle */}
        <div className="flex bg-slate-100 rounded-xl p-1 mb-8">
          {(["connexion", "inscription"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 rounded-[10px] text-sm font-bold transition-all ${
                tab === t ? "bg-white text-ink-900 shadow-sm" : "text-slate-400"
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
              {/* Nom établissement */}
              <div>
                <label className="text-micro font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">
                  Nom de l'établissement
                </label>
                <div className="flex items-center border border-slate-200 rounded-xl px-4 py-3 gap-3 bg-sunk focus-within:border-teal-500 transition-colors">
                  <Store size={16} className="text-slate-400 shrink-0" />
                  <input
                    type="text"
                    value={boutique}
                    onChange={(e) => setBoutique(e.target.value)}
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
                    value={metier}
                    onChange={(e) => setMetier(e.target.value)}
                    required
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm bg-sunk text-slate-800 focus:outline-none focus:border-teal-500 transition-colors appearance-none pr-10"
                  >
                    <option value="">Sélectionner un métier...</option>
                    {METIERS.map((m) => (
                      <option key={m} value={m.toLowerCase()}>
                        {m}
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

          {/* Email */}
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

          {/* Mot de passe */}
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

          {/* Se souvenir + mot de passe oublié — connexion seulement */}
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

          {/* CGU — inscription seulement */}
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

          {/* Submit */}
          <button
            type="submit"
            className="w-full bg-ink-800 hover:bg-ink-900 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors active:scale-95 mt-2"
          >
            {tab === "connexion" ? "Se connecter" : "Créer mon compte"}
            <ArrowRight size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
