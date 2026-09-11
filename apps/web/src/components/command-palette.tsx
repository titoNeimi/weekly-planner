"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, CalendarDays, Users } from "lucide-react";
import { useUser } from "@/context/UserContext";
import { useSearch } from "@/context/SearchContext";
import { useLanguage } from "@/context/LanguageContext";
import { isTypingTarget, hasModifier } from "@/lib/keyboard";

type TaskResult = {
  id: string;
  title: string;
  date: string | null;
  isEvent: boolean;
  done: boolean;
  category: { id: string; name: string; color: string } | null;
};

type TeamTaskResult = {
  id: string;
  title: string;
  date: string | null;
  isEvent: boolean;
  done: boolean;
  teamId: string;
  teamName: string;
};

type Result =
  | { kind: "task"; item: TaskResult }
  | { kind: "team"; item: TeamTaskResult };

export default function CommandPalette() {
  const { user } = useUser();
  const { open, setOpen } = useSearch();
  const { t, ta, tpl } = useLanguage();
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Global Cmd/Ctrl+K (or "/" when not typing) to open, regardless of what page we're on.
  useEffect(() => {
    if (!user) return;
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
      } else if (e.key === "/" && !hasModifier(e) && !isTypingTarget(e.target)) {
        e.preventDefault();
        setOpen(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [user, setOpen]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setResults([]);
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, results.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const result = results[activeIndex];
        if (result) go(result);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, results, activeIndex]);

  useEffect(() => {
    if (!open) return;
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const handle = setTimeout(async () => {
      const res = await fetch(`/api/task/search?q=${encodeURIComponent(q)}`);
      const data: { tasks: TaskResult[]; teamTasks: TeamTaskResult[] } =
        await res.json();
      const combined: Result[] = [
        ...data.tasks.map((item): Result => ({ kind: "task", item })),
        ...data.teamTasks.map((item): Result => ({ kind: "team", item })),
      ];
      setResults(combined);
      setActiveIndex(0);
      setLoading(false);
    }, 250);
    return () => clearTimeout(handle);
  }, [query, open]);

  function go(result: Result) {
    setOpen(false);
    if (result.kind === "team") {
      router.push(`/teams/${result.item.teamId}`);
      return;
    }
    if (result.item.date) {
      router.push(`/agenda?week=${result.item.date.slice(0, 10)}`);
    } else {
      router.push("/dashboard");
    }
  }

  function formatDate(dateStr: string | null): string {
    if (!dateStr) return t("no_date");
    const months = ta("months");
    const d = new Date(`${dateStr.slice(0, 10)}T00:00:00Z`);
    return `${months[d.getUTCMonth()]} ${d.getUTCDate()}`;
  }

  if (!user || !open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm pt-[12vh]"
      onClick={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      <div className="mx-4 w-full max-w-lg overflow-hidden rounded-2xl bg-white dark:bg-gray-900 shadow-xl">
        <div className="flex items-center gap-2.5 border-b border-gray-100 dark:border-gray-800 px-4 py-3">
          <Search size={16} className="shrink-0 text-gray-400 dark:text-gray-500" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("search_placeholder")}
            className="min-w-0 flex-1 bg-transparent text-sm text-gray-900 dark:text-gray-100 outline-none placeholder:text-gray-400"
          />
        </div>

        <div className="max-h-80 overflow-y-auto py-1">
          {query.trim().length < 2 ? (
            <p className="px-4 py-6 text-center text-sm text-gray-400 dark:text-gray-500">
              {t("search_hint")}
            </p>
          ) : loading ? (
            <p className="px-4 py-6 text-center text-sm text-gray-400 dark:text-gray-500">
              {t("search_loading")}
            </p>
          ) : results.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-gray-400 dark:text-gray-500">
              {tpl("search_no_results_for", { q: query.trim() })}
            </p>
          ) : (
            results.map((result, i) => (
              <button
                key={`${result.kind}-${result.item.id}`}
                onClick={() => go(result)}
                onMouseEnter={() => setActiveIndex(i)}
                className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition ${
                  i === activeIndex ? "bg-gray-50 dark:bg-gray-950" : ""
                }`}
              >
                {result.kind === "team" ? (
                  <Users size={14} className="shrink-0 text-blue-400" />
                ) : (
                  <CalendarDays size={14} className="shrink-0 text-gray-300 dark:text-gray-600" />
                )}
                <span
                  className={`min-w-0 flex-1 truncate text-sm ${
                    result.item.done ? "text-gray-300 dark:text-gray-600 line-through" : "text-gray-800 dark:text-gray-200"
                  }`}
                >
                  {result.item.title}
                </span>
                <span className="shrink-0 text-xs text-gray-400 dark:text-gray-500">
                  {result.kind === "team" ? result.item.teamName : formatDate(result.item.date)}
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
