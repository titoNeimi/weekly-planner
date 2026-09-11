"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import type { SerializedTask } from "./WeekView";
import TaskItem from "./TaskItem";
import { toast } from "sonner";
import { getLocalTodayStr } from "@/lib/date";
import { useLanguage } from "@/context/LanguageContext";

export default function TodayHero({
  dateLabel,
  tasks,
  taskItemProps,
  onQuickAdd,
}: {
  dateLabel: string;
  tasks: SerializedTask[];
  taskItemProps: Omit<React.ComponentProps<typeof TaskItem>, "task">;
  onQuickAdd: (task: SerializedTask) => void;
}) {
  const { t, tpl } = useLanguage();
  const [quickTitle, setQuickTitle] = useState("");
  const [adding, setAdding] = useState(false);

  const count = tasks.length;

  async function handleQuickAdd(e: React.FormEvent) {
    e.preventDefault();
    const title = quickTitle.trim();
    if (!title || adding) return;
    setAdding(true);
    const time = `${String(new Date().getHours()).padStart(2, "0")}:00`;
    try {
      const res = await fetch("/api/task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          categoryId: null,
          notes: null,
          date: getLocalTodayStr(),
          time,
          isEvent: false,
        }),
      });
      if (!res.ok) throw new Error("Failed to add task");
      const task: SerializedTask = await res.json();
      onQuickAdd(task);
      setQuickTitle("");
      toast.success(t("task_added"));
    } catch {
      toast.error(t("hero_quick_add_error"));
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline gap-2">
        <h2 className="text-lg font-semibold text-gray-900">{t("overview_today")}</h2>
        <span className="text-sm text-gray-400">{dateLabel}</span>
        {count > 0 && (
          <span className="text-sm text-gray-300">
            &middot; {tpl("hero_task_count", { n: count })}
          </span>
        )}
      </div>

      <form
        onSubmit={handleQuickAdd}
        className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white py-1.5 pl-3 pr-1.5 transition focus-within:border-primary focus-within:ring-1 focus-within:ring-primary-light"
      >
        <input
          value={quickTitle}
          onChange={(e) => setQuickTitle(e.target.value)}
          placeholder={t("hero_quick_add_placeholder")}
          className="min-w-0 flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
        />
        <button
          type="submit"
          disabled={!quickTitle.trim() || adding}
          aria-label={t("hero_add_button")}
          title={t("hero_add_button")}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary text-white transition hover:bg-primary-hover disabled:bg-gray-100 disabled:text-gray-300"
        >
          <Plus size={16} />
        </button>
      </form>

      {count > 0 ? (
        <div className="flex flex-col gap-2.5">
          {tasks.map((task) => (
            <TaskItem key={task.id} task={task} {...taskItemProps} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-400">{t("hero_empty_today")}</p>
      )}
    </div>
  );
}
