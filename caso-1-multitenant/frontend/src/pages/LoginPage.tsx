import { FormEvent, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { z } from "zod";

import { ApiError } from "../api/http";
import { ThemeToggle } from "../components/ThemeToggle";
import { useAuth } from "../hooks/useAuth";

const loginInputSchema = z.object({
  tenantSlug: z.string().trim().min(2, "El slug del tenant es obligatorio"),
  email: z.string().trim().email("El correo no es válido"),
  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
});

type LoginFormState = {
  tenantSlug: string;
  email: string;
  password: string;
};

const initialState: LoginFormState = {
  tenantSlug: "",
  email: "",
  password: ""
};

function getLoginErrorMessage(error: ApiError) {
  if (error.code === "AUTH_INVALID_CREDENTIALS") {
    return "Credenciales inválidas para el tenant indicado";
  }

  if (error.code === "VALIDATION_ERROR") {
    return "Revisa los datos del formulario";
  }

  if (error.status >= 500) {
    return "Error del servidor. Inténtalo de nuevo en unos segundos";
  }

  return "No se pudo iniciar sesión";
}

export function LoginPage() {
  const navigate = useNavigate();
  const { login, status } = useAuth();

  const [form, setForm] = useState<LoginFormState>(initialState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (status === "authenticated") {
    return <Navigate to="/app" replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    const parsed = loginInputSchema.safeParse(form);

    if (!parsed.success) {
      setErrorMessage(parsed.error.issues[0]?.message ?? "Datos de acceso inválidos");
      return;
    }

    setIsSubmitting(true);
    try {
      await login(parsed.data);
      navigate("/app", { replace: true });
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(getLoginErrorMessage(error));
      } else if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("No se pudo iniciar sesión en este momento");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-brand-primary px-5 py-10 md:px-8 md:py-14">
      <div className="pointer-events-none absolute -left-28 top-12 h-64 w-64 rounded-full bg-brand-accent/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-6 right-0 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />

      <section className="relative mx-auto w-full max-w-6xl">
        <div className="grid items-start gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <article className="glass-card p-7 md:p-10">
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center rounded-full border border-brand-accent/40 bg-brand-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-accent">
                Apparte - Prueba técnica GhersonSA
              </span>
              <ThemeToggle />
            </div>

            <h1 className="mt-6 text-3xl font-bold tracking-tight text-white md:text-5xl">
              Control de siniestros
              <span className="block text-brand-accent">automovilísticos</span>
            </h1>

            <p className="mt-5 max-w-xl text-sm leading-6 text-brand-muted md:text-base">
              Consola empresarial para aseguradoras de coche: autenticación
              multi-tenant, trazabilidad por operador y registro operativo en dos
              pasos para incidentes en carretera.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/5 bg-white/5 p-4 transition-all duration-3xl hover:-translate-y-0.5 hover:bg-white/10">
                <p className="text-xs uppercase tracking-wide text-brand-muted">
                  Estado
                </p>
                <p className="mt-2 text-sm font-semibold text-white">Operativo 24/7</p>
              </div>
              <div className="rounded-2xl border border-white/5 bg-white/5 p-4 transition-all duration-3xl hover:-translate-y-0.5 hover:bg-white/10">
                <p className="text-xs uppercase tracking-wide text-brand-muted">
                  Flota
                </p>
                <p className="mt-2 text-sm font-semibold text-white">Automóvil y grúa</p>
              </div>
              <div className="rounded-2xl border border-white/5 bg-white/5 p-4 transition-all duration-3xl hover:-translate-y-0.5 hover:bg-white/10">
                <p className="text-xs uppercase tracking-wide text-brand-muted">
                  Seguridad
                </p>
                <p className="mt-2 text-sm font-semibold text-white">Aislamiento por tenant</p>
              </div>
            </div>

            <div className="mt-8 rounded-2xl border border-white/5 bg-black/20 p-3 text-xs leading-5 text-brand-muted">
              <p className="font-semibold tracking-tight text-white">Cómo funciona</p>
              <p className="mt-1">
                Usa slug de tenant, correo y contraseña para iniciar sesión.
              </p>

              <p className="mt-2 rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-[11px] leading-4">
                <span className="font-semibold text-white">tenant-alpha</span>
                {": "}
                admin@alpha.com, user@alpha.com
                {" · "}
                <span className="font-semibold text-white">tenant-beta</span>
                {": "}
                admin@beta.com, user@beta.com
              </p>
              <p className="mt-1 text-[11px] leading-4">
                Contraseña para todas: <span className="font-semibold text-white">Password123!</span>
              </p>
            </div>
          </article>

          <article className="glass-card w-full p-7 md:p-8 lg:min-h-[34rem] lg:max-w-[28rem] lg:justify-self-center lg:self-center">
            <h2 className="text-2xl font-semibold tracking-tight text-white">
              Iniciar sesión
            </h2>
            <p className="mt-2 text-sm text-brand-muted">
              Accede a tu consola de gestión para tramitación de partes.
            </p>

            <form className="mt-7 space-y-4" onSubmit={handleSubmit} noValidate>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-brand-muted">
                  Slug del tenant
                </span>
                <input
                  type="text"
                  className="brand-input"
                  placeholder="tenant-alpha"
                  value={form.tenantSlug}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      tenantSlug: event.target.value
                    }))
                  }
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-brand-muted">
                  Email
                </span>
                <input
                  type="email"
                  className="brand-input"
                  placeholder="admin@alpha.com"
                  value={form.email}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      email: event.target.value
                    }))
                  }
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-brand-muted">
                  Contraseña
                </span>
                <input
                  type="password"
                  className="brand-input"
                  placeholder="********"
                  value={form.password}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      password: event.target.value
                    }))
                  }
                />
              </label>

              {errorMessage ? (
                <p className="rounded-2xl border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                  {errorMessage}
                </p>
              ) : null}

              <button type="submit" disabled={isSubmitting} className="brand-button w-full disabled:cursor-not-allowed disabled:opacity-70">
                {isSubmitting ? "Iniciando sesión..." : "Iniciar sesión"}
              </button>
            </form>
          </article>
        </div>
      </section>
    </main>
  );
}
