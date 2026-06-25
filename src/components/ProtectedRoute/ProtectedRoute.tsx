import { Navigate, useLocation } from "react-router-dom";
import { useShop } from "../../context/ShopContext";

export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, shop, loading } = useShop();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-app flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-ink-800/20 border-t-ink-800 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  const onboardingAllowedPaths = [
    "/welcome",
    `/boutique/${shop?.id}/catalogue`,
    `/boutique/${shop?.id}`,
    `/boutique/${shop?.id}/equipe`,
  ];

  const isOnboardingPath = onboardingAllowedPaths.some(
    (p) => location.pathname === p,
  );

  if (shop && !shop.onboarded && !isOnboardingPath) {
    return <Navigate to="/welcome" replace />;
  }

  return <>{children}</>;
}
