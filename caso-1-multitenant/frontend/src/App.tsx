import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { useAuth } from "./hooks/useAuth";
import { LoginPage } from "./pages/LoginPage";
import { PrivateHomePage } from "./pages/PrivateHomePage";
import { ProtectedRoute } from "./components/ProtectedRoute";

function RedirectHome() {
  const { status } = useAuth();

  if (status === "loading") {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50 px-4">
        <p className="text-sm font-medium text-slate-600">Cargando sesión...</p>
      </main>
    );
  }

  return status === "authenticated" ? (
    <Navigate to="/app" replace />
  ) : (
    <Navigate to="/login" replace />
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RedirectHome />} />
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <PrivateHomePage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
