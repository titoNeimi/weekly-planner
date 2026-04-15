"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Pencil, Trash2 } from "lucide-react";
import type { SerializedTask, SerializedCategory } from "./WeekView";
import { SWATCH_CLASSES } from "@/lib/category-colors";
import type { CategoryColor } from "@/lib/category-colors";
import AddTaskModal from "./AddTaskModal";
import EditTaskModal from "./EditTaskModal";
import TaskDetailModal from "./TaskDetailModal";
import { toast } from "sonner";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY_LABELS_SHORT = ["M", "T", "W", "T", "F", "S", "S"];

function getCurrentMonthStart(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

function getMonthCells(monthStart: Date): Date[] {
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

export default function MonthView({
  categories,
  activeCategoryId,
  onCategoryCreated,
}: {
  categories: SerializedCategory[];
  activeCategoryId: string | null;
  onCategoryCreated: (category: SerializedCategory) => void;
}) {
  const [monthStart, setMonthStart] = useState(getCurrentMonthStart);
  const [tasks, setTasks] = useState<SerializedTask[]>([]);
  const [fetching, setFetching] = useState(true);
  const [addDate, setAddDate] = useState<Date | null>(null);
  const [detailTask, setDetailTask] = useState<SerializedTask | null>(null);
  const [editTask, setEditTask] = useState<SerializedTask | null>(null);

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

  async function handleDelete(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    await fetch(`/api/task/${id}`, { method: "DELETE" });
    toast.success("Task deleted");
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

  const cells = getMonthCells(monthStart);
  const currentMonth = monthStart.getUTCMonth();
  const todayStr = new Date().toISOString().slice(0, 10);

  const visibleTasks = activeCategoryId
    ? tasks.filter((t) => t.categoryId === activeCategoryId)
    : tasks;

  return (
    <div
      className={`flex flex-col gap-4 transition-opacity ${fetching ? "opacity-50" : ""}`}
    >
      {/* Month header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">
          {MONTH_NAMES[monthStart.getUTCMonth()]} {monthStart.getUTCFullYear()}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            disabled={fetching}
            className="rounded-lg border border-gray-200 p-1.5 text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition"
            aria-label="Previous month"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => navigate(1)}
            disabled={fetching}
            className="rounded-lg border border-gray-200 p-1.5 text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition"
            aria-label="Next month"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-px rounded-xl overflow-hidden border border-gray-200 bg-gray-200">
        {/* Day labels */}
        {DAY_LABELS.map((d, i) => (
          <div
            key={d}
            className="bg-gray-50 py-2 text-center text-xs font-semibold uppercase tracking-widest text-gray-400"
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
            (t) => t.date.slice(0, 10) === dateStr,
          );
          const shownTasks = dayTasks.slice(0, 3);
          const overflow = dayTasks.length - shownTasks.length;

          return (
            <div
              key={i}
              onClick={() => setAddDate(date)}
              className={`group flex min-h-16 sm:min-h-28 cursor-pointer flex-col gap-1 p-1 sm:p-2 ${
                isCurrentMonth ? "bg-white" : "bg-gray-50"
              }`}
            >
              {/* Day number */}
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                  isToday
                    ? "bg-gray-900 text-white"
                    : isCurrentMonth
                      ? "text-gray-700"
                      : "text-gray-300"
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
                    className={`group/task flex cursor-pointer items-start gap-1 rounded px-1 py-0.5 hover:bg-gray-100 transition ${
                      task.done ? "opacity-40" : ""
                    }`}
                  >
                    {task.category ? (
                      <span
                        className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${
                          SWATCH_CLASSES[
                            task.category.color as CategoryColor
                          ] ?? "bg-gray-300"
                        }`}
                      />
                    ) : (
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full border border-gray-300" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p
                        className={`truncate text-xs ${
                          isCurrentMonth ? "text-gray-700" : "text-gray-400"
                        } ${task.done ? "line-through" : ""}`}
                      >
                        {task.title}
                      </p>
                      {task.notes && (
                        <p className="truncate text-[10px] text-gray-400">
                          {task.notes}
                        </p>
                      )}
                    </div>
                    <div className="invisible flex shrink-0 items-center gap-1 group-hover/task:visible">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditTask(task);
                        }}
                        aria-label="Edit task"
                        className="text-gray-300 hover:text-gray-500 transition"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(task.id);
                        }}
                        aria-label="Delete task"
                        className="text-gray-300 hover:text-red-400 transition"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
                {overflow > 0 && (
                  <span className="px-1 text-xs text-gray-400">
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
                className="mt-auto w-full rounded py-0.5 pl-1 text-left text-xs text-gray-300 opacity-0 hover:text-gray-500 transition group-hover:opacity-100"
              >
                + add task
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
