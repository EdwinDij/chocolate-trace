import "./App.css";
import Navbar from "./components/navbar/Navbar";
import Tracking from "./Pages/tracking/Tracking";
import Dashboard from "./Pages/dashboard/Dashboard";
import Management from "./Pages/management/Management";
import Historic from "./Pages/historic/Historic";
import Auth from "./Pages/auth/auth";
import { Routes, Route, useLocation } from "react-router-dom";
import AppLayout from "./layouts/AppLayout";
import AuthLayout from "./layouts/AuthLayout";
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute";
import Boutique from "./Pages/shopDashboard/shopDashboard";
// import { computeBatchesDates } from "./utils/dates";
function App() {
  // console.log(computeBatchesDates("S21-2025", 5));
  const location = useLocation();
  const hideNav = location.pathname === "/auth";
  return (
    <>
      <div className="App">
        <Routes>
          <Route element={<AuthLayout />}>
            <Route path="/auth" element={<Auth />} />
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
            {/* <Route
              path="/boutique/:id/equipe"
              element={
                <ProtectedRoute>
                  <TeamPage />
                </ProtectedRoute>
              }
            /> */}
          </Route>
        </Routes>
        {!hideNav && <Navbar />}
      </div>
    </>
  );
}

export default App;
