"use client";

import { useState } from "react";
import Link from "next/link";
import type { SerializedTask, SerializedCategory } from "./WeekView";
import { SWATCH_CLASSES } from "@/lib/category-colors";
import type { CategoryColor } from "@/lib/category-colors";
import { getLocalTodayStr } from "@/lib/date";
import { useLanguage } from "@/context/LanguageContext";

function getMiniCalendarCells(monthStart: Date): Date[] {
  const year = monthStart.getUTCFullYear();
  const month = monthStart.getUTCMonth();
  const firstDay = monthStart.getUTCDay();
  const startOffset = firstDay === 0 ? 6 : firstDay - 1;
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

  const cells: Date[] = [];
  for (let i = startOffset; i > 0; i--) {
    cells.push(new Date(Date.UTC(year, month, 1 - i)));
  }
  for (let i = 1; i <= daysInMonth; i++) {
    cells.push(new Date(Date.UTC(year, month, i)));
  }
  const remaining = (7 - (cells.length % 7)) % 7;
  for (let i = 1; i <= remaining; i++) {
    cells.push(new Date(Date.UTC(year, month + 1, i)));
  }
  return cells;
}

export default function DashboardSidebar({
  categories,
  activeCategoryId,
  onCategoryChange,
  tasks,
  overdueTasks,
  overdueCount,
  onRescheduleAll,
  onViewOverdue,
}: {
  categories: SerializedCategory[];
  activeCategoryId: string | null;
  onCategoryChange: (id: string | null) => void;
  tasks: SerializedTask[];
  overdueTasks: SerializedTask[];
  overdueCount: number;
  onRescheduleAll: () => Promise<void>;
  onViewOverdue: () => void;
}) {
  const { t, ta, tpl } = useLanguage();
  const DAY_LETTERS = ta("days_letter");
  const MONTH_NAMES = ta("months");
  const [rescheduling, setRescheduling] = useState(false);

  const todayStr = getLocalTodayStr();
  const now = new Date(`${todayStr}T00:00:00Z`);
  const monthStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
  );
  const currentMonth = monthStart.getUTCMonth();
  const cells = getMiniCalendarCells(monthStart);

  const datesWithTasks = new Set(
    tasks.filter((t) => t.date !== null).map((t) => t.date!.slice(0, 10)),
  );

  async function handleReschedule() {
    setRescheduling(true);
    try {
      await onRescheduleAll();
    } finally {
      setRescheduling(false);
    }
  }

  return (
    <aside className="hidden w-72 shrink-0 flex-col gap-6 lg:flex">
      {/* Mini calendar */}
      <div className="rounded-xl border border-gray-100 bg-white p-3">
        <p className="mb-2 px-1 text-xs font-semibold text-gray-700">
          {MONTH_NAMES[currentMonth]} {monthStart.getUTCFullYear()}
        </p>
        <div className="grid grid-cols-7 gap-y-1">
          {DAY_LETTERS.map((d, i) => (
            <span
              key={i}
              className="text-center text-[10px] font-medium text-gray-300"
            >
              {d}
            </span>
          ))}
          {cells.map((date, i) => {
            const dateStr = date.toISOString().slice(0, 10);
            const inMonth = date.getUTCMonth() === currentMonth;
            const isToday = dateStr === todayStr;
            const hasTasks = datesWithTasks.has(dateStr);
            return (
              <Link
                key={i}
                href={`/agenda?week=${dateStr}`}
                className={`relative mx-auto flex h-7 w-7 items-center justify-center rounded-full text-[11px] transition hover:bg-gray-100 ${
                  isToday
                    ? "bg-primary font-semibold text-white"
                    : inMonth
                      ? "text-gray-600"
                      : "text-gray-300"
                }`}
              >
                {date.getUTCDate()}
                {hasTasks && !isToday && (
                  <span className="absolute bottom-0.5 h-1 w-1 rounded-full bg-primary" />
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Categories */}
      {categories.length > 0 && (
        <div className="flex flex-col gap-0.5 rounded-xl border border-gray-100 bg-white p-3">
          <p className="mb-1 px-2 text-xs font-semibold text-gray-700">
            {t("sidebar_categories_title")}
          </p>
          <button
            onClick={() => onCategoryChange(null)}
            className={`rounded-lg px-2 py-1.5 text-left text-sm transition ${
              activeCategoryId === null
                ? "bg-gray-100 font-medium text-gray-900"
                : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            {t("all")}
          </button>
          {categories.map((cat) => {
            const count = tasks.filter((t) => t.categoryId === cat.id).length;
            return (
              <button
                key={cat.id}
                onClick={() =>
                  onCategoryChange(activeCategoryId === cat.id ? null : cat.id)
                }
                className={`flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-sm transition ${
                  activeCategoryId === cat.id
                    ? "bg-gray-100 font-medium text-gray-900"
                    : "text-gray-500 hover:bg-gray-50"
                }`}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${
                      SWATCH_CLASSES[cat.color as CategoryColor] ??
                      "bg-gray-300"
                    }`}
                  />
                  <span className="truncate">{cat.name}</span>
                </span>
                {count > 0 && (
                  <span className="shrink-0 text-xs text-gray-300">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Overdue */}
      {overdueCount > 0 && (
        <div className="flex flex-col gap-2 rounded-xl border border-amber-100 bg-amber-50/60 p-3">
          <p className="px-1 text-xs font-semibold text-amber-800">
            {tpl("overview_overdue", { n: overdueCount })}
          </p>
          <div className="flex flex-col">
            {overdueTasks.slice(0, 3).map((task) => (
              <button
                key={task.id}
                onClick={onViewOverdue}
                className="truncate rounded-lg px-1 py-1 text-left text-xs text-amber-800 hover:bg-amber-100 transition"
              >
                {task.title}
              </button>
            ))}
          </div>
          {overdueCount > 3 && (
            <button
              onClick={onViewOverdue}
              className="px-1 text-left text-xs text-amber-600 hover:text-amber-800 transition"
            >
              {tpl("sidebar_overdue_more", { n: overdueCount - 3 })}
            </button>
          )}
          <button
            onClick={handleReschedule}
            disabled={rescheduling}
            className="mt-1 rounded-lg bg-amber-100 px-2 py-1.5 text-xs font-medium text-amber-800 transition hover:bg-amber-200 disabled:opacity-50"
          >
            {rescheduling ? t("overdue_banner_moving") : t("overdue_banner_action")}
          </button>
        </div>
      )}
    </aside>
  );
}
