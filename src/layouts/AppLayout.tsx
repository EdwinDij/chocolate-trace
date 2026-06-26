import { useShop } from "../context/ShopContext";
import { Outlet } from "react-router-dom";
import Navbar from "../components/navbar/Navbar";
import { useNavigate } from "react-router-dom";

export default function AppLayout() {
  const { shop, error, signOut } = useShop();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <div className="App overflow-x-hidden w-full">
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

      {/* Bandeau onboarding */}
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

      <Outlet />
      <Navbar />
    </div>
  );
}