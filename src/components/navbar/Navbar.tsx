import { Link, useLocation, useParams } from "react-router-dom";
import { useShop } from "../../context/ShopContext";
import { usePlanGate } from "../../hooks/usePlanGate";

function getInitials(name: string): string {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

export default function Navbar() {
  const location = useLocation();
  const { id } = useParams();
  const { shop, member, user, signOut } = useShop();
    const shopId = id || shop?.id;

  const baseTabs = [
    {
      path: `/boutique/${shopId}`,
      label: "Suivi",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="w-5 h-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l3 1.75M9 20.25v-7.5"
          />
        </svg>
      ),
    },
    {
      path: `/boutique/${shopId}/dashboard`,
      label: "Dashboard",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="w-5 h-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
          />
        </svg>
      ),
    },
    {
      path: `/boutique/${shopId}/catalogue`,
      label: "Catalogue",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="w-5 h-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25"
          />
        </svg>
      ),
    },
    { path: `/boutique/${shopId}/historique`, label: "Historique", icon: "📋" },
  ];

  const equipeTab = {
    path: `/boutique/${shopId}/equipe`,
    label: "Équipe",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2}
        stroke="currentColor"
        className="w-5 h-5"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"
        />
      </svg>
    ),
  };

  const tabs =
    member?.role !== "employe" ? [...baseTabs, equipeTab] : baseTabs;

  const displayName = user?.user_metadata?.display_name as string | undefined;
  const { canAddShop } = usePlanGate();

  return (
    <nav className="fixed bottom-0 left-0 w-full bg-ink-800 border-t border-amber-900/40 shadow-[0_-4px_16px_rgba(0,0,0,0.1)] z-50 pb-safe text-foam-100">
      {displayName && (
        <div className="flex items-center justify-between px-4 pt-2 pb-1 border-b border-amber-900/20 min-w-0">
          <div className="flex items-center gap-2 min-w-0 overflow-hidden">
            <div className="w-6 h-6 rounded-full bg-teal-700/60 flex items-center justify-center text-[10px] font-black text-teal-100 shrink-0">
              {getInitials(displayName)}
            </div>
            <span className="text-xs font-semibold text-foam-100/80 truncate">
              {displayName}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-3">
            {!canAddShop && (
              <Link
                to="/tarifs"
                className="text-[10px] font-bold text-teal-400/80 hover:text-teal-300 transition-colors uppercase tracking-wider"
              >
                Mon abonnement
              </Link>
            )}
            <button
              onClick={signOut}
              className="text-[10px] font-bold text-amber-200/40 hover:text-amber-200/70 transition-colors uppercase tracking-wider"
            >
              Déco.
            </button>
          </div>
        </div>
      )}
      <ul className="flex items-center h-16 px-1">
        {tabs.map((tab) => {
          const isActive =
          tab.path === `/boutique/${shopId}`
            ? location.pathname === tab.path
            : location.pathname.startsWith(tab.path);

          return (
            <li key={tab.path} className="flex-1 min-w-0 overflow-hidden">
              <Link
                to={tab.path}
                className={`flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-xl transition-colors duration-200 relative w-full ${
                  isActive
                    ? "text-foam-100"
                    : "text-amber-200/50 hover:text-amber-200/80"
                }`}
              >
                <span className={`transition-opacity duration-200 ${isActive ? "opacity-100" : "opacity-70"}`}>
                  {tab.icon}
                </span>

                <span className="text-[9px] tracking-wide uppercase font-semibold truncate w-full text-center px-0.5">
                  {tab.label}
                </span>

                {isActive && (
                  <span className="absolute bottom-0 w-1 h-1 rounded-full bg-amber-400 shadow-[0_0_8px_#fbbf24]" />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
