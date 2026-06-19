import { Navigate } from "react-router-dom";
import { useShop } from "../../context/ShopContext";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useShop();

  if (loading) {
    return (
      <div className="min-h-screen bg-app flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-ink-800/20 border-t-ink-800 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  return <>{children}</>;
}