import "./App.css";
import Tracking from "./Pages/tracking/Tracking";
import Dashboard from "./Pages/dashboard/Dashboard";
import Management from "./Pages/management/Management";
import Historic from "./Pages/historic/Historic";
import Auth from "./Pages/auth/auth";
import { Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "./layouts/AppLayout";
import AuthLayout from "./layouts/AuthLayout";
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute";
import Boutique from "./Pages/shopDashboard/shopDashboard";
import TeamPage from "./Pages/team/TeamPage";
import InvitePage from "./Pages/invite/InvitePage";
import LotDetail from "./Pages/lotDetail/LotDetail";
import PricingPage from "./Pages/pricing/PricingPage";
import SettingsPage from "./Pages/settings/SettingsPage";
import { useShop } from "./context/ShopContext";

function App() {
  // console.log(computeBatchesDates("S21-2025", 5));
  const { shop } = useShop();

  return (
    <>
      <div className="App">
        <Routes>
          <Route element={<AuthLayout />}>
            <Route path="/auth" element={<Auth />} />
            <Route path="/invite/:token" element={<InvitePage />} />
          </Route>
          <Route element={<AppLayout />}>
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Tracking />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/gestion"
              element={
                <ProtectedRoute>
                  <Management />
                </ProtectedRoute>
              }
            />
            <Route
              path="/historique"
              element={
                <ProtectedRoute>
                  <Historic />
                </ProtectedRoute>
              }
            />
            <Route
              path="/boutique"
              element={
                <ProtectedRoute>
                  <Boutique />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/boutique/:id"
              element={
                <ProtectedRoute>
                  <Tracking />
                </ProtectedRoute>
              }
            />
            <Route
              path="/boutique/:id/catalogue"
              element={
                <ProtectedRoute>
                  <Management />
                </ProtectedRoute>
              }
            />
            <Route
              path="/boutique/:id/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/boutique/:id/historique"
              element={
                <ProtectedRoute>
                  <Historic />
                </ProtectedRoute>
              }
            />
            <Route
              path="/boutique/:id/equipe"
              element={
                <ProtectedRoute>
                  <TeamPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/boutique/:id/lot/:batchId"
              element={
                <ProtectedRoute>
                  <LotDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tarifs"
              element={
                <ProtectedRoute>
                  <PricingPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/boutique/:id/parametres"
              element={
                <ProtectedRoute>
                  <SettingsPage />
                </ProtectedRoute>
              }
            />
          </Route>
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Navigate to={`/boutique/${shop?.id}`} replace />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </>
  );
}

export default App;
