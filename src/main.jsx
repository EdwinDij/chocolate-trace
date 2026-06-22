import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ShopProvider } from "./context/ShopContext";

import "./index.css";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <ShopProvider>
      <App />
    </ShopProvider>
  </BrowserRouter>,
);
