import { FormEvent, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { z } from "zod";

import { ApiError } from "../api/http";
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

  const formHint = useMemo(
    () => "Usa slug de tenant + correo + contraseña para iniciar sesión.",
    []
  );

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
    <main className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-cyan-50 px-5 py-10">
      <section className="mx-auto w-full max-w-5xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-300/50">
        <div className="grid md:grid-cols-[1.05fr_1fr]">
          <article className="space-y-4 bg-slate-900 px-7 py-8 text-slate-100 md:px-8 md:py-10">
            <span className="inline-block rounded-full border border-cyan-300/40 bg-cyan-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-cyan-200">
              Apparte - Prueba técnica GhersonSA
            </span>
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
              Caso 1: Acceso multi-tenant
            </h1>
            <p className="text-sm leading-6 text-slate-300 md:text-base">
              Este acceso valida autenticación y alcance por tenant antes de
              entrar al flujo del formulario.
            </p>

            <div className="rounded-xl border border-slate-700 bg-slate-800/70 p-4 text-xs leading-5 text-slate-300 md:text-sm">
              <p className="font-semibold text-slate-100">Cómo funciona</p>
              <p className="mt-2">{formHint}</p>
            </div>
          </article>

          <article className="px-6 py-8 md:px-8 md:py-10">
            <h2 className="text-xl font-semibold text-slate-900">Iniciar sesión</h2>
            <p className="mt-1 text-sm text-slate-600">
              Introduce tu tenant y tus credenciales para continuar.
            </p>

            <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">
                  Slug del tenant
                </span>
                <input
                  type="text"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
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
                <span className="mb-1 block text-sm font-medium text-slate-700">
                  Email
                </span>
                <input
                  type="email"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                  placeholder="admin@tenant-alpha.com"
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
                <span className="mb-1 block text-sm font-medium text-slate-700">
                  Contraseña
                </span>
                <input
                  type="password"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
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
                <p className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {errorMessage}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? "Iniciando sesión..." : "Iniciar sesión"}
              </button>
            </form>
          </article>
        </div>
      </section>
    </main>
  );
}
