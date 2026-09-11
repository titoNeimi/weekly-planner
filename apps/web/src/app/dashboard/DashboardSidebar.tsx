"use client";

import { useState } from "react";
import Link from "next/link";
import { Pin } from "lucide-react";
import type { SerializedTask, SerializedCategory } from "./WeekView";
import { SWATCH_CLASSES } from "@/lib/category-colors";
import type { CategoryColor } from "@/lib/category-colors";
import { getLocalTodayStr } from "@/lib/date";
import { sortCategories } from "@/lib/categories";
import { monthGridCells, rotateForWeekStart } from "@/lib/week";
import type { WeekStartsOn } from "@/lib/week";
import CategoryContextMenu from "@/components/category-context-menu";
import { useLanguage } from "@/context/LanguageContext";

export default function DashboardSidebar({
  categories,
  activeCategoryId,
  onCategoryChange,
  onCategoryRenamed,
  onCategoryDeleted,
  onCategoryPinToggled,
  tasks,
  overdueTasks,
  overdueCount,
  onRescheduleAll,
  onViewOverdue,
  weekStartsOn = 1,
}: {
  categories: SerializedCategory[];
  activeCategoryId: string | null;
  onCategoryChange: (id: string | null) => void;
  onCategoryRenamed: (id: string, newName: string) => void;
  onCategoryDeleted: (id: string) => void;
  onCategoryPinToggled: (id: string, pinned: boolean) => void;
  tasks: SerializedTask[];
  overdueTasks: SerializedTask[];
  overdueCount: number;
  onRescheduleAll: () => Promise<void>;
  onViewOverdue: () => void;
  weekStartsOn?: WeekStartsOn;
}) {
  const { t, ta, tpl } = useLanguage();
  const DAY_LETTERS = rotateForWeekStart(ta("days_letter"), weekStartsOn);
  const MONTH_NAMES = ta("months");
  const [rescheduling, setRescheduling] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    category: SerializedCategory;
    x: number;
    y: number;
  } | null>(null);

  const todayStr = getLocalTodayStr();
  const now = new Date(`${todayStr}T00:00:00Z`);
  const monthStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
  );
  const currentMonth = monthStart.getUTCMonth();
  const cells = monthGridCells(monthStart, weekStartsOn);

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
      <div className="rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-3">
        <p className="mb-2 px-1 text-xs font-semibold text-gray-700 dark:text-gray-300">
          {MONTH_NAMES[currentMonth]} {monthStart.getUTCFullYear()}
        </p>
        <div className="grid grid-cols-7 gap-y-1">
          {DAY_LETTERS.map((d, i) => (
            <span
              key={i}
              className="text-center text-[10px] font-medium text-gray-300 dark:text-gray-600"
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
                className={`relative mx-auto flex h-7 w-7 items-center justify-center rounded-full text-[11px] transition hover:bg-gray-100 dark:hover:bg-gray-800 ${
                  isToday
                    ? "bg-primary font-semibold text-white"
                    : inMonth
                      ? "text-gray-600 dark:text-gray-400"
                      : "text-gray-300 dark:text-gray-600"
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
        <div className="flex flex-col gap-0.5 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-3">
          <p className="mb-1 px-2 text-xs font-semibold text-gray-700 dark:text-gray-300">
            {t("sidebar_categories_title")}
          </p>
          <button
            onClick={() => onCategoryChange(null)}
            className={`rounded-lg px-2 py-1.5 text-left text-sm transition ${
              activeCategoryId === null
                ? "bg-gray-100 dark:bg-gray-800 font-medium text-gray-900 dark:text-gray-100"
                : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
            }`}
          >
            {t("all")}
          </button>
          {sortCategories(categories).map((cat) => {
            const count = tasks.filter((t) => t.categoryId === cat.id).length;
            return (
              <button
                key={cat.id}
                onClick={() =>
                  onCategoryChange(activeCategoryId === cat.id ? null : cat.id)
                }
                onContextMenu={(e) => {
                  e.preventDefault();
                  setContextMenu({ category: cat, x: e.clientX, y: e.clientY });
                }}
                className={`flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-sm transition ${
                  activeCategoryId === cat.id
                    ? "bg-gray-100 dark:bg-gray-800 font-medium text-gray-900 dark:text-gray-100"
                    : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${
                      SWATCH_CLASSES[cat.color as CategoryColor] ??
                      "bg-gray-300 dark:bg-gray-600"
                    }`}
                  />
                  <span className="truncate">{cat.name}</span>
                  {cat.pinned && (
                    <Pin size={10} className="shrink-0 text-gray-300 dark:text-gray-600" />
                  )}
                </span>
                {count > 0 && (
                  <span className="shrink-0 text-xs text-gray-300 dark:text-gray-600">
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

      {contextMenu && (
        <CategoryContextMenu
          category={contextMenu.category}
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          onRenamed={onCategoryRenamed}
          onDeleted={onCategoryDeleted}
          onPinToggled={onCategoryPinToggled}
        />
      )}
    </aside>
  );
}
