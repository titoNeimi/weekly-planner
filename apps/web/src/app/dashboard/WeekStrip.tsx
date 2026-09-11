"use client";

import Link from "next/link";
import type { SerializedTask, SerializedTeamTask } from "./WeekView";
import { getLocalTodayStr } from "@/lib/date";
import { rotateForWeekStart, startOfWeekUTC } from "@/lib/week";
import type { WeekStartsOn } from "@/lib/week";
import { useLanguage } from "@/context/LanguageContext";

function getCurrentWeekDates(todayStr: string, weekStartsOn: WeekStartsOn): string[] {
  const today = new Date(`${todayStr}T00:00:00Z`);
  const start = startOfWeekUTC(today, weekStartsOn);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setUTCDate(start.getUTCDate() + i);
    return d.toISOString().slice(0, 10);
  });
}

export default function WeekStrip({
  tasks,
  teamTasks,
  weekStartsOn = 1,
}: {
  tasks: SerializedTask[];
  teamTasks: SerializedTeamTask[];
  weekStartsOn?: WeekStartsOn;
}) {
  const { ta, tpl } = useLanguage();
  const DAY_LETTERS = rotateForWeekStart(ta("days_letter"), weekStartsOn);
  const today = getLocalTodayStr();
  const weekDates = getCurrentWeekDates(today, weekStartsOn);
  const weekDateSet = new Set(weekDates);

  const countsByDate = new Map<string, { total: number; open: number }>();
  function addCount(dateStr: string, done: boolean) {
    const entry = countsByDate.get(dateStr) ?? { total: 0, open: 0 };
    entry.total += 1;
    if (!done) entry.open += 1;
    countsByDate.set(dateStr, entry);
  }
  for (const task of tasks) {
    if (!task.date) continue;
    const d = task.date.slice(0, 10);
    if (weekDateSet.has(d)) addCount(d, task.done);
  }
  for (const task of teamTasks) {
    if (!task.date) continue;
    const d = task.date.slice(0, 10);
    if (weekDateSet.has(d)) addCount(d, task.done);
  }

  return (
    <div className="flex items-stretch justify-between gap-1 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 px-1.5 py-2 sm:gap-2 sm:px-2">
      {weekDates.map((dateStr, i) => {
        const isToday = dateStr === today;
        const counts = countsByDate.get(dateStr);
        const dayNum = Number(dateStr.slice(8, 10));

        return (
          <Link
            key={dateStr}
            href={`/agenda?week=${dateStr}`}
            title={tpl("weekstrip_go_to_day", { n: counts?.total ?? 0 })}
            className={`flex flex-1 flex-col items-center gap-1 rounded-lg py-1.5 transition hover:bg-gray-50 dark:hover:bg-gray-800 ${
              isToday ? "bg-primary-light" : ""
            }`}
          >
            <span
              className={`text-[10px] font-medium uppercase ${
                isToday ? "text-primary" : "text-gray-400 dark:text-gray-500"
              }`}
            >
              {DAY_LETTERS[i]}
            </span>
            <span
              className={`text-xs font-semibold ${
                isToday ? "text-primary" : "text-gray-600 dark:text-gray-400"
              }`}
            >
              {dayNum}
            </span>
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                counts && counts.open > 0
                  ? "bg-primary"
                  : counts && counts.total > 0
                    ? "bg-gray-300 dark:bg-gray-600"
                    : "bg-transparent"
              }`}
            />
          </Link>
        );
      })}
    </div>
  );
}
