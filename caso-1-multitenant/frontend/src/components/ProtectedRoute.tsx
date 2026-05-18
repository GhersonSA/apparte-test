import { PropsWithChildren } from "react";
import { Navigate } from "react-router-dom";

import { useAuth } from "../hooks/useAuth";

export function ProtectedRoute({ children }: PropsWithChildren) {
  const { status } = useAuth();

  if (status === "loading") {
    return (
      <main className="grid min-h-screen place-items-center bg-brand-primary px-4">
        <div className="glass-card px-6 py-4">
          <p className="text-sm font-semibold tracking-tight text-brand-muted">
            Cargando sesión...
          </p>
        </div>
      </main>
    );
  }

  if (status !== "authenticated") {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
