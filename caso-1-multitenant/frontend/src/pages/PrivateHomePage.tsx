import { FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";

import { createReportRequest, listReportsRequest } from "../api/reports";
import { ApiError } from "../api/http";
import { ThemeToggle } from "../components/ThemeToggle";
import { useAuth } from "../hooks/useAuth";
import { CreateReportRequest, InterventionType, Report } from "../types/report";

const stepOneSchema = z.object({
  firstName: z.string().trim().min(2, "El nombre es obligatorio"),
  lastName: z.string().trim().min(2, "Los apellidos son obligatorios"),
  location: z.string().trim().min(2, "El lugar es obligatorio")
});

const reportSchema = stepOneSchema.extend({
  interventionType: z.enum([
    "ACCIDENT_TIME",
    "FIRE_ASSISTANCE",
    "MEDICAL_ASSISTANCE",
    "VEHICLE_REMOVAL"
  ])
});

const interventionOptions: Array<{ value: InterventionType; label: string }> = [
  { value: "ACCIDENT_TIME", label: "Accidente de tráfico" },
  { value: "FIRE_ASSISTANCE", label: "Incendio del vehículo" },
  { value: "MEDICAL_ASSISTANCE", label: "Asistencia médica" },
  { value: "VEHICLE_REMOVAL", label: "Retirada con grúa" }
];

const initialForm: CreateReportRequest = {
  firstName: "",
  lastName: "",
  location: "",
  interventionType: "ACCIDENT_TIME"
};

function formatInterventionLabel(type: InterventionType) {
  return (
    interventionOptions.find((option) => option.value === type)?.label ??
    "Tipo desconocido"
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString("es-ES", {
        dateStyle: "short",
        timeStyle: "short"
      });
}

export function PrivateHomePage() {
  const navigate = useNavigate();
  const { token, user, tenant, logout } = useAuth();

  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = useState<CreateReportRequest>(initialForm);
  const [reports, setReports] = useState<Report[]>([]);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const currentStepLabel = useMemo(
    () => (step === 1 ? "Paso 1 de 2" : "Paso 2 de 2"),
    [step]
  );

  useEffect(() => {
    if (!token) {
      return;
    }

    setReportsLoading(true);
    listReportsRequest(token)
      .then((response) => {
        setReports(response.reports);
      })
      .catch(() => {
        setFormError("No se pudieron cargar los reportes");
      })
      .finally(() => {
        setReportsLoading(false);
      });
  }, [token]);

  function resetForm() {
    setForm(initialForm);
    setStep(1);
  }

  function validateStepOne() {
    const parsed = stepOneSchema.safeParse(form);
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? "Revisa los datos del paso 1");
      return false;
    }

    return true;
  }

  function goToStepTwo() {
    setFormMessage(null);
    setFormError(null);

    if (!validateStepOne()) {
      return;
    }

    setStep(2);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormMessage(null);
    setFormError(null);

    if (!token) {
      setFormError("No hay sesión activa");
      return;
    }

    const parsed = reportSchema.safeParse(form);
    if (!parsed.success) {
      setFormError(
        parsed.error.issues[0]?.message ?? "Revisa los datos antes de enviar"
      );
      return;
    }

    setSubmitLoading(true);
    try {
      const created = await createReportRequest(token, parsed.data);
      setReports((prev) => [created.report, ...prev]);
      setFormMessage("Reporte guardado correctamente");
      resetForm();
    } catch (error) {
      if (error instanceof ApiError && error.code === "VALIDATION_ERROR") {
        setFormError("El backend rechazó los datos. Revisa el formulario");
      } else {
        setFormError("No se pudo guardar el reporte");
      }
    } finally {
      setSubmitLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-brand-primary px-5 py-8 md:px-8 md:py-10">
      <div className="pointer-events-none absolute -right-24 top-10 h-64 w-64 rounded-full bg-brand-accent/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-8 left-0 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />

      <section className="relative mx-auto w-full max-w-7xl space-y-6">
        <header className="glass-card p-6 md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="inline-flex rounded-full border border-brand-accent/40 bg-brand-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-accent">
                Operaciones de siniestros
              </span>
              <h1 className="mt-3 text-3xl font-bold tracking-tight text-white md:text-4xl">
                Centro de gestión de partes
              </h1>
              <p className="mt-2 text-sm text-brand-muted md:text-base">
                Registro y seguimiento de incidencias para pólizas de automóvil
                con aislamiento multi-tenant.
              </p>
            </div>

            <div className="flex flex-col items-start gap-3 sm:items-end">
              <ThemeToggle />
              <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-brand-muted">
                <p>
                  Tenant activo: <span className="font-semibold text-white">{tenant?.slug ?? user?.tenantId ?? "-"}</span>
                </p>
                <p>
                  Operador: <span className="font-semibold text-white">{user?.email ?? "Usuario desconocido"}</span>
                </p>
              </div>
            </div>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <article className="glass-card p-6 md:p-7">
            <div className="mb-5 flex items-center justify-between gap-4">
              <h2 className="text-xl font-semibold tracking-tight text-white md:text-2xl">
                Nuevo parte automovilístico
              </h2>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-muted">
                {currentStepLabel}
              </span>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit} noValidate>
              {step === 1 ? (
                <>
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-brand-muted">
                      Nombre del conductor
                    </span>
                    <input
                      type="text"
                      value={form.firstName}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          firstName: event.target.value
                        }))
                      }
                      placeholder="Ej: Laura"
                      className="brand-input"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-brand-muted">
                      Apellidos
                    </span>
                    <input
                      type="text"
                      value={form.lastName}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          lastName: event.target.value
                        }))
                      }
                      placeholder="Ej: Martínez Ruiz"
                      className="brand-input"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-brand-muted">
                      Ubicación del siniestro
                    </span>
                    <input
                      type="text"
                      value={form.location}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          location: event.target.value
                        }))
                      }
                      placeholder="Ej: M-30, salida 11"
                      className="brand-input"
                    />
                  </label>

                  <button type="button" onClick={goToStepTwo} className="brand-button w-full">
                    Continuar al paso 2
                  </button>
                </>
              ) : (
                <>
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-brand-muted">
                      Tipo de intervención
                    </span>
                    <select
                      value={form.interventionType}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          interventionType: event.target.value as InterventionType
                        }))
                      }
                      className="brand-select"
                    >
                      {interventionOptions.map((option) => (
                        <option key={option.value} value={option.value} className="bg-brand-surface text-white">
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-brand-muted">
                    <p>
                      <span className="font-semibold text-white">Resumen:</span>{" "}
                      {form.firstName} {form.lastName} - {form.location}
                    </p>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2">
                    <button type="button" onClick={() => setStep(1)} className="brand-button-secondary">
                      Volver al paso 1
                    </button>
                    <button type="submit" disabled={submitLoading} className="brand-button disabled:cursor-not-allowed disabled:opacity-70">
                      {submitLoading ? "Guardando..." : "Guardar reporte"}
                    </button>
                  </div>
                </>
              )}
            </form>

            {formError ? (
              <p className="mt-4 rounded-2xl border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {formError}
              </p>
            ) : null}

            {formMessage ? (
              <p className="mt-4 rounded-2xl border border-brand-accent/40 bg-brand-accent/10 px-4 py-3 text-sm text-brand-accent">
                {formMessage}
              </p>
            ) : null}
          </article>

          <aside className="space-y-4">
            <article className="glass-card p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-muted">
                Entorno de operación
              </p>
              <p className="mt-2 text-lg font-semibold tracking-tight text-white">
                {tenant?.name ?? "Tenant desconocido"}
              </p>
              <p className="text-sm text-brand-muted">{tenant?.slug ?? user?.tenantId ?? "-"}</p>
              <p className="mt-3 text-sm text-brand-muted">
                Usuario: <span className="font-medium text-white">{user?.email ?? "Usuario desconocido"}</span>
              </p>
              <p className="text-sm text-brand-muted">
                Rol: <span className="font-medium text-white">{user?.role ?? "-"}</span>
              </p>
            </article>

            <article className="glass-card p-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-brand-muted">
                  Historial de partes
                </h3>
                <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs font-semibold text-white">
                  {reports.length}
                </span>
              </div>

              {reportsLoading ? (
                <p className="text-sm text-brand-muted">Cargando reportes...</p>
              ) : reports.length === 0 ? (
                <p className="text-sm text-brand-muted">Todavía no hay reportes guardados.</p>
              ) : (
                <ul className="max-h-96 space-y-2 overflow-auto pr-1">
                  {reports.map((report) => (
                    <li key={report.id} className="rounded-2xl border border-white/10 bg-black/20 p-3 transition-all duration-3xl hover:-translate-y-0.5 hover:bg-black/30">
                      <p className="text-sm font-semibold tracking-tight text-white">
                        {report.firstName} {report.lastName}
                      </p>
                      <p className="text-xs text-brand-muted">{report.location}</p>
                      <p className="mt-1 text-xs font-medium text-brand-accent">
                        {formatInterventionLabel(report.interventionType)}
                      </p>
                      <p className="mt-1 text-[11px] text-brand-muted">
                        {formatDate(report.createdAt)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          </aside>
        </div>

        <div className="flex flex-wrap gap-3">
          <button className="brand-button-secondary" onClick={() => navigate("/")}>
            Ir al inicio
          </button>
          <button
            className="brand-button-secondary"
            onClick={() => {
              logout();
              navigate("/login", { replace: true });
            }}
          >
            Cerrar sesión
          </button>
        </div>
      </section>
    </main>
  );
}
