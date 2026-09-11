"use client";

import { useEffect } from "react";

export default function ErrorPage({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex flex-1 flex-col items-center justify-center bg-[oklch(0.978_0.000_0)] dark:bg-gray-950 px-6 py-16">
      <div className="flex flex-col items-center gap-6 text-center">
        <p className="text-5xl font-semibold text-gray-200 dark:text-gray-700">500</p>
        <div className="flex flex-col gap-2">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Something went wrong</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            An unexpected error occurred. You can try again or go back to the dashboard.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={unstable_retry}
            className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-white transition hover:bg-primary-hover"
          >
            Try again
          </button>
          <a
            href="/dashboard"
            className="rounded-lg border border-gray-200 dark:border-gray-700 px-5 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 transition hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            Go to dashboard
          </a>
        </div>
      </div>
    </main>
  );
}
