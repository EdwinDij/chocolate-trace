import Navbar from "../components/navbar/Navbar";
import { Outlet } from "react-router-dom";

export default function AppLayout() {
  return (
    <div className="App">
      <Outlet />
      <Navbar />
    </div>
  );
}