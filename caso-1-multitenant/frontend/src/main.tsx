import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import "./index.css";

const storedTheme = window.localStorage.getItem("apparte-theme");
if (storedTheme === "dark" || storedTheme === "light") {
  document.documentElement.setAttribute("data-theme", storedTheme);
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
