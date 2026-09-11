"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/context/LanguageContext";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useLanguage();

  async function signInWithGoogle() {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback`,
        },
      });
      if (authError) {
        setError(t("login_error_default"));
        setLoading(false);
      }
    } catch {
      setError(t("login_error_generic"));
      setLoading(false);
    }
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-12 bg-[oklch(0.960_0.018_150)] dark:bg-[oklch(0.180_0.020_150)]">
      <div className="w-full max-w-sm animate-fade-in rounded-2xl bg-white dark:bg-gray-900 px-8 py-10 shadow-[0_4px_24px_rgba(0,0,0,0.10)]">

        <div className="flex flex-col items-center text-center">
          <WeekMark />
          <h1 className="mt-5 text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">
            Weekly Planner
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {t("login_subtitle")}
          </p>
        </div>

        <div className="mt-8 flex flex-col gap-3">
          {error && (
            <p
              role="alert"
              className="rounded-lg border border-red-100 bg-red-50 px-3 py-2.5 text-sm text-red-600"
            >
              {error}
            </p>
          )}

          <button
            onClick={signInWithGoogle}
            disabled={loading}
            className="flex w-full cursor-pointer items-center justify-center gap-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition hover:border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 active:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? <SpinnerIcon /> : <GoogleIcon />}
            {loading ? t("login_signing_in") : t("login_google")}
          </button>
        </div>

        <p className="mt-6 text-center text-xs text-gray-500 dark:text-gray-400">
          {t("login_no_account")}
        </p>
      </div>
    </main>
  );
}

function WeekMark() {
  const barWidth = 3;
  const gap = 4;
  const heights = [14, 18, 24, 30, 24, 18, 14];
  const maxH = 30;
  const totalW = heights.length * barWidth + (heights.length - 1) * gap;

  return (
    <svg
      width={totalW}
      height={maxH}
      viewBox={`0 0 ${totalW} ${maxH}`}
      aria-hidden="true"
    >
      {heights.map((h, i) => (
        <rect
          key={i}
          x={i * (barWidth + gap)}
          y={maxH - h}
          width={barWidth}
          height={h}
          rx={1.5}
          fill={i === 3 ? "oklch(0.480 0.120 150)" : "oklch(0.875 0.010 150)"}
        />
      ))}
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg
      className="h-4 w-4 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
        className="opacity-25"
      />
      <path
        fill="currentColor"
        className="opacity-75"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}
