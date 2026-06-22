import Navbar from "../components/navbar/Navbar";
import { Outlet } from "react-router-dom";

export default function AppLayout() {
  return (
    <div className="App overflow-x-hidden w-full">
      <Outlet />
      <Navbar />
    </div>
  );
}