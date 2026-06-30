import { useShop } from "../context/ShopContext";
import { Outlet, useLocation, useNavigate, Link } from "react-router-dom";
import Navbar from "../components/navbar/Navbar";
import {
  Package,
  LayoutDashboard,
  BookOpen,
  History,
  Users,
  Settings,
  LogOut,
} from "lucide-react";

export default function AppLayout() {
  const { shop, member, plan, error, signOut } = useShop();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const shopId = shop?.id;

  const navItems = [
    { path: `/boutique/${shopId}`, label: "Suivi", icon: <Package size={18} />, exact: true },
    { path: `/boutique/${shopId}/dashboard`, label: "Dashboard", icon: <LayoutDashboard size={18} /> },
    { path: `/boutique/${shopId}/catalogue`, label: "Catalogue", icon: <BookOpen size={18} /> },
    { path: `/boutique/${shopId}/historique`, label: "Historique", icon: <History size={18} /> },
    ...(member?.role !== "employe"
      ? [{ path: `/boutique/${shopId}/equipe`, label: "Équipe", icon: <Users size={18} />, exact: false }]
      : []),
    { path: `/boutique/${shopId}/parametres`, label: "Paramètres", icon: <Settings size={18} />, exact: false },
  ];

  const isActive = (path: string, exact?: boolean) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  return (
    <div className="App overflow-x-hidden w-full">
      {/* Sidebar desktop */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-screen w-60 bg-ink-800 z-40 overflow-y-auto">
        <div className="px-5 pt-7 pb-5 border-b border-foam-100/10">
          <p className="text-foam-100 font-black text-lg tracking-tight">Traquéo</p>
          {shop && (
            <p className="text-foam-100/50 text-xs font-medium mt-0.5 truncate">{shop.name}</p>
          )}
        </div>

        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          {navItems.map((item) => {
            const active = isActive(item.path, item.exact);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors duration-150 ${
                  active
                    ? "bg-teal-800 text-foam-100"
                    : "text-foam-100/50 hover:text-foam-100 hover:bg-white/10"
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 pb-6 border-t border-foam-100/10 pt-4 flex flex-col gap-1">
          {plan && plan !== "gratuit" && (
            <div className="px-3 py-2">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-teal-700/50 text-teal-300 px-2.5 py-1 rounded-full capitalize">
                {plan}
              </span>
            </div>
          )}
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-foam-100/50 hover:text-foam-100 hover:bg-white/10 transition-colors duration-150 w-full text-left"
          >
            <LogOut size={18} />
            Déconnexion
          </button>
        </div>
      </aside>

      {error && (
        <div className="fixed top-0 left-0 w-full z-50 bg-red-600 text-white text-center text-xs py-3 px-4 font-medium flex items-center justify-center gap-3">
          <span>⚠️ {error}</span>
          <button
            onClick={handleSignOut}
            className="font-bold underline hover:text-red-100"
          >
            Se déconnecter
          </button>
        </div>
      )}

      {shop && !shop.onboarded && !error && (
        <div className="fixed top-0 left-0 w-full z-50 bg-teal-500 text-white text-center text-xs py-2 font-medium flex items-center justify-center gap-2">
          <span>🎯 Configuration en cours</span>
          <button
            onClick={() => navigate("/welcome")}
            className="font-bold underline hover:text-teal-100"
          >
            Reprendre
          </button>
        </div>
      )}

      <div className="lg:ml-60">
        <Outlet />
      </div>
      <Navbar />
    </div>
  );
}
