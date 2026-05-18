import { useNavigate } from "react-router-dom";

import { useAuth } from "../hooks/useAuth";

export function PrivateHomePage() {
  const navigate = useNavigate();
  const { user, tenant, logout } = useAuth();

  return (
    <main className="min-h-screen bg-slate-100 px-5 py-8 md:px-8 md:py-10">
      <section className="mx-auto w-full max-w-4xl space-y-6">
        <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-900">Sesion iniciada</h1>
          <p className="mt-2 text-sm text-slate-600">
            La autenticacion esta activa. En la siguiente fase implementaré el
            formulario de dos pasos usando esta sesion.
          </p>
        </header>

        <article className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Tenant
            </p>
            <p className="mt-2 text-lg font-medium text-slate-900">
              {tenant?.name ?? "Tenant desconocido"}
            </p>
            <p className="text-sm text-slate-600">{tenant?.slug ?? "-"}</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Usuario autenticado
            </p>
            <p className="mt-2 text-lg font-medium text-slate-900">
              {user?.email ?? "Usuario desconocido"}
            </p>
            <p className="text-sm text-slate-600">Rol: {user?.role ?? "-"}</p>
          </div>
        </article>

        <div className="flex flex-wrap gap-3">
          <button
            className="rounded-lg bg-cyan-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-cyan-600"
            onClick={() => navigate("/")}
          >
            Ir al inicio
          </button>
          <button
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 transition hover:bg-slate-50"
            onClick={() => {
              logout();
              navigate("/login", { replace: true });
            }}
          >
            Cerrar sesion
          </button>
        </div>
      </section>
    </main>
  );
}
