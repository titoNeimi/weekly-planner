"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Pencil, Trash2 } from "lucide-react";
import type { SerializedTask, SerializedCategory } from "./WeekView";
import { SWATCH_CLASSES } from "@/lib/category-colors";
import type { CategoryColor } from "@/lib/category-colors";
import AddTaskModal from "./AddTaskModal";
import EditTaskModal from "./EditTaskModal";
import TaskDetailModal from "./TaskDetailModal";
import { stripMarkdown } from "@/lib/strip-markdown";
import { toast } from "sonner";
import { getLocalTodayStr } from "@/lib/date";
import { monthGridCells, rotateForWeekStart } from "@/lib/week";
import type { WeekStartsOn } from "@/lib/week";
import { useLanguage } from "@/context/LanguageContext";
import { undoableAction } from "@/lib/undo-toast";

function getCurrentMonthStart(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
}

export default function MonthView({
  categories,
  activeCategoryId,
  onCategoryCreated,
  weekStartsOn = 1,
}: {
  categories: SerializedCategory[];
  activeCategoryId: string | null;
  onCategoryCreated: (category: SerializedCategory) => void;
  weekStartsOn?: WeekStartsOn;
}) {
  const { t, ta } = useLanguage();
  const DAY_LABELS = rotateForWeekStart(ta("days_short"), weekStartsOn);
  const DAY_LABELS_SHORT = rotateForWeekStart(ta("days_letter"), weekStartsOn);
  const MONTH_NAMES = ta("months");

  const [monthStart, setMonthStart] = useState(getCurrentMonthStart);
  const [tasks, setTasks] = useState<SerializedTask[]>([]);
  const [fetching, setFetching] = useState(true);
  const [addDate, setAddDate] = useState<Date | null>(null);
  const [detailTask, setDetailTask] = useState<SerializedTask | null>(null);
  const [editTask, setEditTask] = useState<SerializedTask | null>(null);
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);

  useEffect(() => {
    fetchMonth(monthStart);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchMonth(start: Date) {
    setFetching(true);
    const from = start.toISOString();
    const to = new Date(
      Date.UTC(
        start.getUTCFullYear(),
        start.getUTCMonth() + 1,
        0,
        23,
        59,
        59,
        999,
      ),
    ).toISOString();
    const res = await fetch(`/api/task?from=${from}&to=${to}`);
    const data: SerializedTask[] = await res.json();
    setTasks(data);
    setFetching(false);
  }

  function handleDelete(id: string) {
    const removed = tasks.find((t) => t.id === id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
    undoableAction({
      message: t("task_deleted"),
      undoLabel: t("toast_undo"),
      commit: async () => {
        const res = await fetch(`/api/task/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Failed to delete task");
      },
      rollback: () => {
        if (removed) setTasks((prev) => [...prev, removed]);
      },
      errorMessage: t("task_delete_error"),
      rollbackOnError: true,
    });
  }

  async function handleTaskDrop(taskId: string, dateStr: string) {
    const task = tasks.find((t) => t.id === taskId);
    if (!task || !task.date || task.date.slice(0, 10) === dateStr) return;
    // A whole-day move keeps the task's existing time-of-day (or lack of one)
    // as-is — an all-day task must stay all-day, not turn into one timed at
    // midnight.
    const timeStr = task.allDay ? null : task.date.slice(11, 16);
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, date: `${dateStr}T${timeStr ?? "00:00"}:00.000Z` }
          : t,
      ),
    );
    try {
      const res = await fetch(`/api/task/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: dateStr, time: timeStr }),
      });
      if (!res.ok) throw new Error("Failed to reschedule");
      const updated: SerializedTask = await res.json();
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
      toast.success(t("task_rescheduled"));
    } catch {
      setTasks((prev) => prev.map((t) => (t.id === taskId ? task : t)));
      toast.error(t("task_reschedule_error"));
    }
  }

  async function navigate(direction: number) {
    const next = new Date(
      Date.UTC(
        monthStart.getUTCFullYear(),
        monthStart.getUTCMonth() + direction,
        1,
      ),
    );
    setMonthStart(next);
    await fetchMonth(next);
  }

  const cells = monthGridCells(monthStart, weekStartsOn);
  const currentMonth = monthStart.getUTCMonth();
  const todayStr = getLocalTodayStr();

  const visibleTasks = activeCategoryId
    ? tasks.filter((t) => t.categoryId === activeCategoryId)
    : tasks;

  return (
    <div
      className={`flex flex-col gap-4 transition-opacity ${fetching ? "opacity-50" : ""}`}
    >
      {/* Month header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          {MONTH_NAMES[monthStart.getUTCMonth()]} {monthStart.getUTCFullYear()}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            disabled={fetching}
            className="rounded-lg border border-gray-200 dark:border-gray-700 p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 transition"
            aria-label={t("month_prev")}
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => navigate(1)}
            disabled={fetching}
            className="rounded-lg border border-gray-200 dark:border-gray-700 p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 transition"
            aria-label={t("month_next")}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-px rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-200 dark:bg-gray-700">
        {/* Day labels */}
        {DAY_LABELS.map((d, i) => (
          <div
            key={d}
            className="bg-gray-50 dark:bg-gray-950 py-2 text-center text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500"
          >
            <span className="sm:hidden">{DAY_LABELS_SHORT[i]}</span>
            <span className="hidden sm:inline">{d}</span>
          </div>
        ))}

        {/* Day cells */}
        {cells.map((date, i) => {
          const dateStr = date.toISOString().slice(0, 10);
          const isCurrentMonth = date.getUTCMonth() === currentMonth;
          const isToday = dateStr === todayStr;
          const dayTasks = visibleTasks.filter(
            (t) => t.date !== null && t.date.slice(0, 10) === dateStr,
          );
          const shownTasks = dayTasks.slice(0, 3);
          const overflow = dayTasks.length - shownTasks.length;

          return (
            <div
              key={i}
              onClick={() => setAddDate(date)}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                setDragOverDate(dateStr);
              }}
              onDragLeave={() =>
                setDragOverDate((d) => (d === dateStr ? null : d))
              }
              onDrop={(e) => {
                e.preventDefault();
                setDragOverDate(null);
                const taskId = e.dataTransfer.getData("text/plain");
                if (taskId) handleTaskDrop(taskId, dateStr);
              }}
              className={`group flex min-h-16 sm:min-h-28 cursor-pointer flex-col gap-1 p-1 transition sm:p-2 ${
                dragOverDate === dateStr
                  ? "bg-primary-light"
                  : isCurrentMonth
                    ? "bg-white dark:bg-gray-900"
                    : "bg-gray-50 dark:bg-gray-950"
              }`}
            >
              {/* Day number */}
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                  isToday
                    ? "bg-primary text-white"
                    : isCurrentMonth
                      ? "text-gray-700 dark:text-gray-300"
                      : "text-gray-300 dark:text-gray-600"
                }`}
              >
                {date.getUTCDate()}
              </span>

              {/* Task rows */}
              <div className="flex flex-col gap-0.5">
                {shownTasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setDetailTask(task);
                    }}
                    draggable
                    onDragStart={(e) => {
                      e.stopPropagation();
                      e.dataTransfer.setData("text/plain", task.id);
                      e.dataTransfer.effectAllowed = "move";
                    }}
                    className={`group/task flex cursor-pointer items-start gap-1 rounded px-1 py-0.5 hover:bg-gray-100 dark:hover:bg-gray-800 transition ${
                      task.done ? "opacity-40" : ""
                    }`}
                  >
                    {task.category ? (
                      <span
                        className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${
                          SWATCH_CLASSES[
                            task.category.color as CategoryColor
                          ] ?? "bg-gray-300 dark:bg-gray-600"
                        }`}
                      />
                    ) : (
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full border border-gray-300 dark:border-gray-600" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p
                        className={`truncate text-xs ${
                          isCurrentMonth ? "text-gray-700 dark:text-gray-300" : "text-gray-400 dark:text-gray-500"
                        } ${task.done ? "line-through" : ""}`}
                      >
                        {task.title}
                      </p>
                      {task.notes && (
                        <p className="truncate text-[10px] text-gray-400 dark:text-gray-500">
                          {stripMarkdown(task.notes)}
                        </p>
                      )}
                    </div>
                    <div className="invisible flex shrink-0 items-center gap-1 group-hover/task:visible">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditTask(task);
                        }}
                        aria-label={t("task_edit")}
                        className="text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 transition"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(task.id);
                        }}
                        aria-label={t("task_delete")}
                        className="text-gray-300 dark:text-gray-600 hover:text-red-400 transition"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
                {overflow > 0 && (
                  <span className="px-1 text-xs text-gray-400 dark:text-gray-500">
                    +{overflow} more
                  </span>
                )}
              </div>

              {/* Add task */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setAddDate(date);
                }}
                className="mt-auto w-full rounded py-0.5 pl-1 text-left text-xs text-gray-300 dark:text-gray-600 opacity-0 hover:text-gray-500 dark:hover:text-gray-400 transition group-hover:opacity-100"
              >
                {t("month_add_task")}
              </button>
            </div>
          );
        })}
      </div>

      {addDate && (
        <AddTaskModal
          defaultDate={addDate}
          onClose={() => setAddDate(null)}
          onSaved={(task) => {
            setTasks((prev) => [...prev, task]);
            setAddDate(null);
          }}
          categories={categories}
          onCategoryCreated={onCategoryCreated}
        />
      )}

      {detailTask && (
        <TaskDetailModal
          task={detailTask}
          onClose={() => setDetailTask(null)}
          onEdit={() => {
            setEditTask(detailTask);
            setDetailTask(null);
          }}
          onToggle={async () => {
            const newDone = !detailTask.done;
            setDetailTask({ ...detailTask, done: newDone });
            setTasks((prev) =>
              prev.map((t) => (t.id === detailTask.id ? { ...t, done: newDone } : t)),
            );
            await fetch(`/api/task/${detailTask.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ done: newDone }),
            });
          }}
          onSaved={(updated) => {
            setDetailTask(updated);
            setTasks((prev) =>
              prev.map((t) => (t.id === updated.id ? updated : t)),
            );
          }}
        />
      )}

      {editTask && (
        <EditTaskModal
          task={editTask}
          categories={categories}
          onClose={() => setEditTask(null)}
          onSaved={(updated) => {
            setTasks((prev) =>
              prev.map((t) => (t.id === updated.id ? updated : t)),
            );
            setEditTask(null);
          }}
        />
      )}
    </div>
  );
}
