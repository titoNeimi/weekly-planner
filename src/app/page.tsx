import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="flex flex-col items-center gap-3">
        <h1 className="text-4xl font-semibold tracking-tight text-gray-900">
          Plan your week, together
        </h1>
        <p className="max-w-sm text-gray-500">
          A shared planner for small teams. Add tasks, track progress, and stay in sync — day by day.
        </p>
      </div>
      <Link
        href="/login"
        className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-700 transition"
      >
        Get started
      </Link>
    </main>
  );
}
