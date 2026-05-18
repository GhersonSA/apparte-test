import { FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";

import { createReportRequest, listReportsRequest } from "../api/reports";
import { ApiError } from "../api/http";
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
  { value: "ACCIDENT_TIME", label: "Hora del accidente" },
  { value: "FIRE_ASSISTANCE", label: "Asistencia por incendio" },
  { value: "MEDICAL_ASSISTANCE", label: "Asistencia medica" },
  { value: "VEHICLE_REMOVAL", label: "Retirada de vehiculo" }
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
      setFormError("No hay sesion activa");
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
        setFormError("El backend rechazo los datos. Revisa el formulario");
      } else {
        setFormError("No se pudo guardar el reporte");
      }
    } finally {
      setSubmitLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 px-5 py-8 md:px-8 md:py-10">
      <section className="mx-auto w-full max-w-6xl space-y-6">
        <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-900">Sesion iniciada</h1>
          <p className="mt-2 text-sm text-slate-600">
            Completa el formulario en dos pasos y guarda los datos asociados a tu
            tenant y usuario.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between gap-4">
              <h2 className="text-xl font-semibold text-slate-900">
                Formulario de reporte
              </h2>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
                {currentStepLabel}
              </span>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit} noValidate>
              {step === 1 ? (
                <>
                  <label className="block">
                    <span className="mb-1 block text-sm font-medium text-slate-700">
                      Nombre
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
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1 block text-sm font-medium text-slate-700">
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
                      placeholder="Ej: Martinez Ruiz"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1 block text-sm font-medium text-slate-700">
                      Lugar
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
                      placeholder="Ej: Calle Alcala, Madrid"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={goToStepTwo}
                    className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
                  >
                    Continuar al paso 2
                  </button>
                </>
              ) : (
                <>
                  <label className="block">
                    <span className="mb-1 block text-sm font-medium text-slate-700">
                      Tipo de intervencion
                    </span>
                    <select
                      value={form.interventionType}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          interventionType: event.target.value as InterventionType
                        }))
                      }
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                    >
                      {interventionOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                    <p>
                      <span className="font-medium">Resumen:</span> {form.firstName} {form.lastName} - {form.location}
                    </p>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 transition hover:bg-slate-50"
                    >
                      Volver al paso 1
                    </button>
                    <button
                      type="submit"
                      disabled={submitLoading}
                      className="rounded-lg bg-cyan-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-cyan-600 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {submitLoading ? "Guardando..." : "Guardar reporte"}
                    </button>
                  </div>
                </>
              )}
            </form>

            {formError ? (
              <p className="mt-4 rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {formError}
              </p>
            ) : null}

            {formMessage ? (
              <p className="mt-4 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                {formMessage}
              </p>
            ) : null}
          </article>

          <aside className="space-y-4">
            <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Tenant
              </p>
              <p className="mt-2 text-base font-semibold text-slate-900">
                {tenant?.name ?? "Tenant desconocido"}
              </p>
              <p className="text-sm text-slate-600">{tenant?.slug ?? user?.tenantId ?? "-"}</p>
              <p className="mt-3 text-sm text-slate-700">
                Usuario: <span className="font-medium">{user?.email ?? "Usuario desconocido"}</span>
              </p>
              <p className="text-sm text-slate-700">
                Rol: <span className="font-medium">{user?.role ?? "-"}</span>
              </p>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
                  Reportes guardados
                </h3>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                  {reports.length}
                </span>
              </div>

              {reportsLoading ? (
                <p className="text-sm text-slate-600">Cargando reportes...</p>
              ) : reports.length === 0 ? (
                <p className="text-sm text-slate-600">Todavia no hay reportes guardados.</p>
              ) : (
                <ul className="max-h-80 space-y-2 overflow-auto pr-1">
                  {reports.map((report) => (
                    <li
                      key={report.id}
                      className="rounded-lg border border-slate-200 bg-slate-50 p-3"
                    >
                      <p className="text-sm font-medium text-slate-900">
                        {report.firstName} {report.lastName}
                      </p>
                      <p className="text-xs text-slate-600">{report.location}</p>
                      <p className="mt-1 text-xs text-cyan-700">
                        {formatInterventionLabel(report.interventionType)}
                      </p>
                      <p className="mt-1 text-[11px] text-slate-500">
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
