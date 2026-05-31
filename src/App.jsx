import "./App.css";
import Navbar from "./components/navbar/Navbar";
import Tracking from "./Pages/tracking/Tracking";
import Dashboard from "./Pages/dashboard/Dashboard";
import Management from "./Pages/management/Management";
import { Routes, Route } from "react-router-dom";
// import { computeBatchesDates } from "./utils/dates";
function App() {
  // console.log(computeBatchesDates("S21-2025", 5));
  return (
    <>
      <div className="App">
        <Routes>
          <Route path="/" element={<Tracking />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/gestion" element={<Management />} />
        </Routes>
        <Navbar />
      </div>
    </>
  );
}

export default App;
