import React from "react";
import { Link } from "react-router-dom";
export default function Navbar() {
  const tabs = [
    { path: "/", label: "Suivi", icon: "📦" },
    { path: "/alertes", label: "Alertes", icon: "⚠️" },
    { path: "/gestion", label: "Gérer", icon: "⚙️" },
  ];
  return (
    <>
      <nav className="fixed bottom-0 left-0 w-full shadow-md z-10 border-t bg-amber-800/85 border-stone-800/60">
        <ul className="flex justify-around py-2">
          {tabs.map((tab) => (
            <li key={tab.path}>
              <Link
                to={tab.path}
                className="flex flex-col items-center gap-1 text-amber-100"
              >
                <span>{tab.icon}</span>
                <span className="text-s font-medium">{tab.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
