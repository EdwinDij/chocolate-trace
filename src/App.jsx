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
            <Route path="/" element={<Tracking />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/gestion" element={<Management />} />
            <Route path="/historique" element={<Historic />} />
          </Route>
        </Routes>
        {!hideNav && <Navbar />}
      </div>
    </>
  );
}

export default App;
