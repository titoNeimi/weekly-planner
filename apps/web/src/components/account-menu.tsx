"use client";

import { useEffect, useRef, useState } from "react";
import Avatar from "@/components/avatar";
import { useDensity } from "@/context/DensityContext";
import { useLanguage } from "@/context/LanguageContext";
import { useTheme } from "@/context/ThemeContext";

type Props = {
  avatarUrl?: string;
  name?: string;
  email?: string;
  initialWeekStartsOn: 0 | 1;
  onSignOut: () => Promise<void>;
};

// Single trigger for everything account-scoped — who's signed in, week-start
// day, density, theme, language, and sign out — so the topbar carries one
// control here instead of four separate ones.
export default function AccountMenu({
  avatarUrl,
  name,
  email,
  initialWeekStartsOn,
  onSignOut,
}: Props) {
  const { t, lang, setLang } = useLanguage();
  const { density, setDensity } = useDensity();
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [weekStartsOn, setWeekStartsOn] = useState(initialWeekStartsOn);
  const [saving, setSaving] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleDown);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleDown);
      document.removeEventListener("keydown", handleKey);
    };
  }, []);

  async function handleWeekStartChange(value: 0 | 1) {
    if (value === weekStartsOn || saving) return;
    setWeekStartsOn(value);
    setSaving(true);
    try {
      await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weekStartsOn: value }),
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={t("account_menu_label")}
        aria-expanded={open}
        className="flex items-center gap-2 rounded-md p-1 pr-2 transition hover:bg-gray-100 dark:hover:bg-gray-800"
      >
        <Avatar avatarUrl={avatarUrl} name={name} email={email} />
        <span className="hidden max-w-[9rem] truncate text-sm text-gray-600 dark:text-gray-400 sm:inline">
          {name ?? email}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-64 rounded-xl border border-gray-100 bg-white p-3 shadow-lg dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center gap-2.5 border-b border-gray-100 px-1 pb-3 dark:border-gray-800">
            <Avatar avatarUrl={avatarUrl} name={name} email={email} />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                {name ?? email}
              </p>
              {name && email && (
                <p className="truncate text-xs text-gray-400 dark:text-gray-500">
                  {email}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1.5 border-b border-gray-100 py-3 dark:border-gray-800">
            <span className="px-1 text-[11px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
              {t("settings_week_start")}
            </span>
            <div className="flex gap-1 rounded-lg bg-gray-100 p-0.5 dark:bg-gray-800">
              <button
                onClick={() => handleWeekStartChange(1)}
                className={`flex-1 rounded-md px-2 py-1 text-xs font-medium transition ${
                  weekStartsOn === 1
                    ? "bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-gray-100"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
              >
                {t("settings_monday")}
              </button>
              <button
                onClick={() => handleWeekStartChange(0)}
                className={`flex-1 rounded-md px-2 py-1 text-xs font-medium transition ${
                  weekStartsOn === 0
                    ? "bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-gray-100"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
              >
                {t("settings_sunday")}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1.5 border-b border-gray-100 py-3 dark:border-gray-800">
            <span className="px-1 text-[11px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
              {t("settings_density")}
            </span>
            <div className="flex gap-1 rounded-lg bg-gray-100 p-0.5 dark:bg-gray-800">
              <button
                onClick={() => setDensity("comfortable")}
                className={`flex-1 rounded-md px-2 py-1 text-xs font-medium transition ${
                  density === "comfortable"
                    ? "bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-gray-100"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
              >
                {t("settings_comfortable")}
              </button>
              <button
                onClick={() => setDensity("compact")}
                className={`flex-1 rounded-md px-2 py-1 text-xs font-medium transition ${
                  density === "compact"
                    ? "bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-gray-100"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
              >
                {t("settings_compact")}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1.5 border-b border-gray-100 py-3 dark:border-gray-800">
            <span className="px-1 text-[11px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
              {t("settings_theme")}
            </span>
            <div className="flex gap-1 rounded-lg bg-gray-100 p-0.5 dark:bg-gray-800">
              <button
                onClick={() => setTheme("light")}
                className={`flex-1 rounded-md px-2 py-1 text-xs font-medium transition ${
                  theme === "light"
                    ? "bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-gray-100"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
              >
                {t("settings_theme_light")}
              </button>
              <button
                onClick={() => setTheme("dark")}
                className={`flex-1 rounded-md px-2 py-1 text-xs font-medium transition ${
                  theme === "dark"
                    ? "bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-gray-100"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
              >
                {t("settings_theme_dark")}
              </button>
              <button
                onClick={() => setTheme("system")}
                className={`flex-1 rounded-md px-2 py-1 text-xs font-medium transition ${
                  theme === "system"
                    ? "bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-gray-100"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
              >
                {t("settings_theme_system")}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1.5 border-b border-gray-100 py-3 dark:border-gray-800">
            <span className="px-1 text-[11px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
              {t("settings_language")}
            </span>
            <div className="flex gap-1 rounded-lg bg-gray-100 p-0.5 dark:bg-gray-800">
              <button
                onClick={() => setLang("en")}
                className={`flex-1 rounded-md px-2 py-1 text-xs font-medium transition ${
                  lang === "en"
                    ? "bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-gray-100"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
              >
                English
              </button>
              <button
                onClick={() => setLang("es")}
                className={`flex-1 rounded-md px-2 py-1 text-xs font-medium transition ${
                  lang === "es"
                    ? "bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-gray-100"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
              >
                Español
              </button>
            </div>
          </div>

          <form action={onSignOut} className="pt-1">
            <button className="w-full rounded-md px-2 py-1.5 text-left text-sm text-gray-500 transition hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100">
              {t("topbar_sign_out")}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
