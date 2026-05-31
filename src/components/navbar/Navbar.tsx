import { Link, useLocation } from "react-router-dom";

export default function Navbar() {
  const location = useLocation();

  const tabs = [
    {
      path: "/",
      label: "Suivi",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l3 1.75M9 20.25v-7.5" />
        </svg>
      ),
    },
    {
      path: "/dashboard", 
      label: "Dashboard",
      // Icône Cloche / Alerte
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
        </svg>
      ),
    },
    {
      path: "/gestion",
      label: "Catalogue",
      // Icône Grimoire / Liste de configuration
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
        </svg>
      ),
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 w-full bg-[#3E2723] border-t border-amber-900/40 shadow-[0_-4px_16px_rgba(0,0,0,0.1)] z-50 pb-safe">
      <ul className="flex justify-around items-center h-16 px-2">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path;
          
          return (
            <li key={tab.path} className="flex-1 max-w-[100px]">
              <Link
                to={tab.path}
                className={`flex flex-col items-center justify-center gap-1 py-1.5 rounded-xl transition-all duration-200 relative ${
                  isActive
                    ? "text-[#FFF8E1] font-bold scale-105"
                    : "text-amber-200/50 hover:text-amber-200/80 font-medium"
                }`}
              >
                {/* Icône animée au clic */}
                <span className={`transition-transform duration-200 ${isActive ? "translate-y-[-1px]" : ""}`}>
                  {tab.icon}
                </span>

                {/* Label textuel ajusté */}
                <span className="text-[10px] tracking-wide uppercase">
                  {tab.label}
                </span>

                {/* Petite puce lumineuse sous l'onglet actif */}
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