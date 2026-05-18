import { useTheme } from "../hooks/useTheme";

export function ThemeToggle() {
  const { isLight, toggleTheme } = useTheme();
  const nextThemeLabel = isLight ? "oscuro" : "claro";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Cambiar a tema ${nextThemeLabel}`}
      aria-pressed={!isLight}
      className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2 py-1.5 transition-all duration-3xl hover:bg-white/10"
    >
      <span className="sr-only">Cambiar tema</span>

      <span className="relative inline-flex h-6 w-14 items-center justify-between rounded-full border border-white/10 bg-black/30 px-1 transition-all duration-300">
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`h-3.5 w-3.5 transition-all duration-300 ${
            isLight ? "text-amber-300" : "text-brand-muted/70"
          }`}
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2" />
          <path d="M12 20v2" />
          <path d="M4.93 4.93l1.41 1.41" />
          <path d="M17.66 17.66l1.41 1.41" />
          <path d="M2 12h2" />
          <path d="M20 12h2" />
          <path d="M6.34 17.66l-1.41 1.41" />
          <path d="M19.07 4.93l-1.41 1.41" />
        </svg>

        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`h-3.5 w-3.5 transition-all duration-300 ${
            isLight ? "text-brand-muted/70" : "text-indigo-200"
          }`}
        >
          <path d="M12 3a7 7 0 1 0 9 9 9 9 0 1 1-9-9z" />
        </svg>

        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-brand-accent shadow-soft transition-all duration-300 ${
            isLight ? "translate-x-0.5" : "translate-x-8"
          }`}
        />
      </span>
    </button>
  );
}
