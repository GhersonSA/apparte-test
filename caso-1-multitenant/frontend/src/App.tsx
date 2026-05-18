import { useEffect, useState } from "react";

type HealthStatus = {
  service: string;
  status: string;
  timestamp: string;
};

function App() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

    fetch(`${apiUrl}/api/health`)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Health check request failed");
        }
        return response.json() as Promise<HealthStatus>;
      })
      .then((payload) => {
        setHealth(payload);
      })
      .catch((fetchError: Error) => {
        setError(fetchError.message);
      });
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-cyan-50 px-6 py-10">
      <section className="mx-auto w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/60">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
          Caso practico 1: Aplicacion web multi-tenant con formulario
        </h1>

        <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50/60 p-4">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-blue-900">
            Backend health
          </h2>

          {health && !error ? (
            <pre className="overflow-x-auto rounded-lg bg-slate-900 p-4 text-xs text-emerald-300 md:text-sm">
              {JSON.stringify(health, null, 2)}
            </pre>
          ) : (
            <p className="text-sm text-slate-700">{error ?? "Loading..."}</p>
          )}
        </div>
      </section>
    </main>
  );
}

export default App;
