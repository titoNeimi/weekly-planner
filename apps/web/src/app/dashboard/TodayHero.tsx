"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import type { SerializedTask } from "./WeekView";
import TaskItem from "./TaskItem";
import { toast } from "sonner";
import { getLocalTodayStr, addDaysToDateStr } from "@/lib/date";
import { useLanguage } from "@/context/LanguageContext";
import { useDensity } from "@/context/DensityContext";

export default function TodayHero({
  dateLabel,
  tasks,
  taskItemProps,
  onQuickAdd,
  emptyMessage,
}: {
  dateLabel: string;
  tasks: SerializedTask[];
  taskItemProps: Omit<React.ComponentProps<typeof TaskItem>, "task">;
  onQuickAdd: (task: SerializedTask) => void;
  emptyMessage?: string;
}) {
  const { t, tpl } = useLanguage();
  const { density } = useDensity();
  const [quickTitle, setQuickTitle] = useState("");
  const [adding, setAdding] = useState(false);
  const [addingTomorrow, setAddingTomorrow] = useState(false);

  const count = tasks.length;

  async function addTaskFor(dateStr: string): Promise<boolean> {
    const title = quickTitle.trim();
    if (!title) return false;
    const time = `${String(new Date().getHours()).padStart(2, "0")}:00`;
    try {
      const res = await fetch("/api/task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          categoryId: null,
          notes: null,
          date: dateStr,
          time,
          isEvent: false,
        }),
      });
      if (!res.ok) throw new Error("Failed to add task");
      const task: SerializedTask = await res.json();
      // The parent re-buckets by date, so this is safe even when dateStr
      // isn't today — the task will show up under the right day.
      onQuickAdd(task);
      setQuickTitle("");
      toast.success(t("task_added"));
      return true;
    } catch {
      toast.error(t("hero_quick_add_error"));
      return false;
    }
  }

  async function handleQuickAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!quickTitle.trim() || adding) return;
    setAdding(true);
    await addTaskFor(getLocalTodayStr());
    setAdding(false);
  }

  async function handleQuickAddTomorrow() {
    if (!quickTitle.trim() || addingTomorrow) return;
    setAddingTomorrow(true);
    await addTaskFor(addDaysToDateStr(getLocalTodayStr(), 1));
    setAddingTomorrow(false);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline gap-2">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t("overview_today")}</h2>
        <span className="text-sm text-gray-400 dark:text-gray-500">{dateLabel}</span>
        {count > 0 && (
          <span className="text-sm text-gray-300 dark:text-gray-600">
            &middot; {tpl("hero_task_count", { n: count })}
          </span>
        )}
      </div>

      <form
        onSubmit={handleQuickAdd}
        className="flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 py-1.5 pl-3 pr-1.5 transition focus-within:border-primary focus-within:ring-1 focus-within:ring-primary-light"
      >
        <input
          value={quickTitle}
          onChange={(e) => setQuickTitle(e.target.value)}
          placeholder={t("hero_quick_add_placeholder")}
          className="min-w-0 flex-1 bg-transparent text-sm text-gray-900 dark:text-gray-100 outline-none placeholder:text-gray-400"
        />
        <button
          type="button"
          onClick={handleQuickAddTomorrow}
          disabled={!quickTitle.trim() || addingTomorrow}
          aria-label={t("hero_tomorrow_button")}
          title={t("hero_tomorrow_button")}
          className="shrink-0 rounded-md px-2 py-1 text-xs font-medium text-gray-400 dark:text-gray-500 transition hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-40"
        >
          {t("overview_tomorrow")}
        </button>
        <button
          type="submit"
          disabled={!quickTitle.trim() || adding}
          aria-label={t("hero_add_button")}
          title={t("hero_add_button")}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary text-white transition hover:bg-primary-hover disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-300 dark:disabled:text-gray-600"
        >
          <Plus size={16} />
        </button>
      </form>

      {count > 0 ? (
        <div className={`flex flex-col ${density === "compact" ? "gap-1" : "gap-2.5"}`}>
          {tasks.map((task) => (
            <TaskItem key={task.id} task={task} {...taskItemProps} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-400 dark:text-gray-500">{emptyMessage ?? t("hero_empty_today")}</p>
      )}
    </div>
  );
}
