import Navbar from "../components/navbar/Navbar";
import { Outlet } from "react-router-dom";
import { useShop } from "../context/ShopContext";
import { useNavigate } from "react-router-dom";

export default function AppLayout() {
  const { shop } = useShop();
  const navigate = useNavigate();
  return (
    <div className="App overflow-x-hidden w-full">
      {shop && !shop.onboarded && (
        <div className="fixed top-0 left-0 w-full z-50 bg-teal-500 text-white text-center text-xs py-2 font-medium flex items-center justify-center gap-2">
          <span>🎯 Configuration en cours</span>
          <button
            onClick={() => navigate("/welcome")}
            className="font-bold underline hover:text-teal-100"
          >
            Reprendre →
          </button>
        </div>
      )}
      <Outlet />
      <Navbar />
    </div>
  );
}
