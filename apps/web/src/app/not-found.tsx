import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center bg-[oklch(0.978_0.000_0)] dark:bg-gray-950 px-6 py-16">
      <div className="flex flex-col items-center gap-6 text-center">
        <p className="text-5xl font-semibold text-gray-200 dark:text-gray-700">404</p>
        <div className="flex flex-col gap-2">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Page not found</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-white transition hover:bg-primary-hover"
        >
          Go to dashboard
        </Link>
      </div>
    </main>
  );
}
