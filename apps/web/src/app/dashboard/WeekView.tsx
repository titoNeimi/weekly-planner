"use client";

import { useEffect, useRef, useState } from "react";
import DayColumn from "./DayColumn";
import DayTimeline from "./DayTimeline";
import MonthView from "./MonthView";
import {
  CATEGORY_COLORS,
  COLOR_CLASSES,
  SWATCH_CLASSES,
} from "@/lib/category-colors";
import type { CategoryColor } from "@/lib/category-colors";
import CategoryContextMenu from "@/components/category-context-menu";
import { toast } from "sonner";
import { getLocalTodayStr } from "@/lib/date";
import { sortCategories } from "@/lib/categories";
import { rotateForWeekStart, weekStartOffset } from "@/lib/week";
import type { WeekStartsOn } from "@/lib/week";
import { useLanguage } from "@/context/LanguageContext";
import { isTypingTarget, hasModifier } from "@/lib/keyboard";

export type SerializedCategory = {
  id: string;
  name: string;
  color: string;
  // Optional: task-embedded categories (e.g. Task.category) don't select this.
  pinned?: boolean;
};

export type SerializedTask = {
  id: string;
  title: string;
  categoryId: string | null;
  category: SerializedCategory | null;
  notes: string | null;
  done: boolean;
  isEvent: boolean;
  allDay: boolean;
  date: string | null;
  userId: string;
  recurringTaskId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SerializedTeamTask = {
  id: string;
  title: string;
  notes: string | null;
  date: string | null;
  done: boolean;
  isEvent: boolean;
  teamId: string;
  teamName: string;
  assignedToName: string | null;
  assignedToAvatarUrl: string | null;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
};


function getWeekDays(weekStart: string): Date[] {
  const start = new Date(weekStart);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setUTCDate(start.getUTCDate() + i);
    return d;
  });
}

function shiftWeek(weekStart: string, direction: number): string {
  const d = new Date(weekStart);
  d.setUTCDate(d.getUTCDate() + direction * 7);
  return d.toISOString();
}

function isCurrentWeek(days: Date[]): boolean {
  const todayLocal = getLocalTodayStr();
  return days.some((d) => d.toISOString().slice(0, 10) === todayLocal);
}

function getCurrentWeekStart(weekStartsOn: WeekStartsOn): string {
  const now = new Date();
  const diff = weekStartOffset(now.getDay(), weekStartsOn);
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diff);
  const y = start.getFullYear();
  const m = String(start.getMonth() + 1).padStart(2, "0");
  const d = String(start.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}T00:00:00.000Z`;
}

export default function WeekView({
  tasks: initialTasks,
  teamTasks: initialTeamTasks,
  categories: initialCategories,
  weekStart: initialWeekStart,
  weekStartsOn = 1,
}: {
  tasks: SerializedTask[];
  teamTasks: SerializedTeamTask[];
  categories: SerializedCategory[];
  weekStart: string;
  weekStartsOn?: WeekStartsOn;
}) {
  const { t, ta } = useLanguage();
  const DAY_LABELS = rotateForWeekStart(ta("days_short"), weekStartsOn);
  const DAY_LABELS_LONG = rotateForWeekStart(ta("days_long"), weekStartsOn);
  const MONTH_NAMES = ta("months");

  const [weekStart, setWeekStart] = useState(initialWeekStart);
  // `initialWeekStart` is recomputed server-side (e.g. `router.refresh()`
  // after the week-start-day preference changes in Settings) without
  // remounting this component — keep local state in sync so the date grid
  // never disagrees with the day-of-week headers derived from `weekStartsOn`.
  useEffect(() => {
    setWeekStart(initialWeekStart);
  }, [initialWeekStart]);
  const [tasks, setTasks] = useState(initialTasks);
  const [teamTasks, setTeamTasks] = useState(initialTeamTasks);
  const [fetching, setFetching] = useState(false);
  const [categories, setCategories] =
    useState<SerializedCategory[]>(initialCategories);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState<CategoryColor>(
    CATEGORY_COLORS[0],
  );
  const [creatingCategory, setCreatingCategory] = useState(false);
  const categoryNameRef = useRef<HTMLInputElement>(null);
  const [contextMenu, setContextMenu] = useState<{
    category: SerializedCategory;
    x: number;
    y: number;
  } | null>(null);
  const [view, setView] = useState<"week" | "day" | "month">("week");
  const [activeDayIndex, setActiveDayIndex] = useState<number>(() => {
    const todayStr = getLocalTodayStr();
    const idx = getWeekDays(initialWeekStart).findIndex(
      (d) => d.toISOString().slice(0, 10) === todayStr,
    );
    return idx >= 0 ? idx : 0;
  });

  const days = getWeekDays(weekStart);
  const monday = days[0];
  const sunday = days[6];
  const sameMonth = monday.getUTCMonth() === sunday.getUTCMonth();
  const rangeLabel = sameMonth
    ? `${MONTH_NAMES[monday.getUTCMonth()]} ${monday.getUTCDate()}–${sunday.getUTCDate()}, ${monday.getUTCFullYear()}`
    : `${MONTH_NAMES[monday.getUTCMonth()]} ${monday.getUTCDate()} – ${MONTH_NAMES[sunday.getUTCMonth()]} ${sunday.getUTCDate()}, ${sunday.getUTCFullYear()}`;

  const activeDate = days[activeDayIndex];
  const dayHeaderLabel = `${DAY_LABELS_LONG[activeDayIndex]}, ${MONTH_NAMES[activeDate.getUTCMonth()]} ${activeDate.getUTCDate()}`;

  async function fetchWeek(start: string) {
    const days = getWeekDays(start);
    const from = days[0].toISOString();
    const to = new Date(days[6]);
    to.setUTCHours(23, 59, 59, 999);
    const toStr = to.toISOString();

    setFetching(true);
    const [tasksRes, teamTasksRes] = await Promise.all([
      fetch(`/api/task?from=${from}&to=${toStr}`),
      fetch(`/api/team-task?from=${from}&to=${toStr}&assignedToMe=true`),
    ]);
    const [data, teamData] = await Promise.all([
      tasksRes.json() as Promise<SerializedTask[]>,
      teamTasksRes.json() as Promise<SerializedTeamTask[]>,
    ]);
    setTasks(data);
    setTeamTasks(teamData);
    setFetching(false);
  }

  async function navigate(direction: number) {
    const next = shiftWeek(weekStart, direction);
    setWeekStart(next);
    setActiveDayIndex(0);
    await fetchWeek(next);
  }

  async function goToday() {
    const today = getCurrentWeekStart(weekStartsOn);
    setWeekStart(today);
    const todayStr = getLocalTodayStr();
    const idx = getWeekDays(today).findIndex(
      (d) => d.toISOString().slice(0, 10) === todayStr,
    );
    setActiveDayIndex(idx >= 0 ? idx : 0);
    await fetchWeek(today);
  }

  async function navigateDay(direction: number) {
    const nextIndex = activeDayIndex + direction;
    if (nextIndex < 0) {
      const prevWeek = shiftWeek(weekStart, -1);
      setWeekStart(prevWeek);
      setActiveDayIndex(6);
      await fetchWeek(prevWeek);
      return;
    }
    if (nextIndex > 6) {
      const nextWeek = shiftWeek(weekStart, 1);
      setWeekStart(nextWeek);
      setActiveDayIndex(0);
      await fetchWeek(nextWeek);
      return;
    }
    setActiveDayIndex(nextIndex);
  }

  // Left/Right arrow keys step through days (week/day view only — month view
  // has its own month-level navigation), as long as the user isn't typing.
  useEffect(() => {
    if (view === "month") return;
    function onKey(e: KeyboardEvent) {
      if (hasModifier(e) || isTypingTarget(e.target)) return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        navigateDay(-1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        navigateDay(1);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, activeDayIndex, weekStart]);

  function handleTaskCreated(task: SerializedTask) {
    setTasks((prev) => [...prev, task]);
  }

  function handleTaskToggled(id: string, done: boolean) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done } : t)));
  }

  function handleTaskUpdated(task: SerializedTask) {
    setTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)));
  }

  function handleTaskDeleted(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }

  function handleTaskReplaced(oldId: string, task: SerializedTask) {
    setTasks((prev) => prev.map((t) => (t.id === oldId ? task : t)));
  }

  async function handleTaskDrop(taskId: string, dateStr: string) {
    const task = tasks.find((t) => t.id === taskId);
    if (!task || !task.date || task.date.slice(0, 10) === dateStr) return;
    // A whole-day move keeps the task's existing time-of-day (or lack of one)
    // as-is — an all-day task must stay all-day, not turn into one timed at
    // midnight.
    const timeStr = task.allDay ? null : task.date.slice(11, 16);
    handleTaskUpdated({
      ...task,
      date: `${dateStr}T${timeStr ?? "00:00"}:00.000Z`,
    });
    try {
      const res = await fetch(`/api/task/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: dateStr, time: timeStr }),
      });
      if (!res.ok) throw new Error("Failed to reschedule");
      const updated: SerializedTask = await res.json();
      if (updated.id !== taskId) {
        handleTaskReplaced(taskId, updated);
      } else {
        handleTaskUpdated(updated);
      }
      toast.success(t("task_rescheduled"));
    } catch {
      handleTaskUpdated(task);
      toast.error(t("task_reschedule_error"));
    }
  }

  async function handleHourDrop(taskId: string, time: string) {
    const task = tasks.find((tk) => tk.id === taskId);
    if (!task || !task.date || task.date.slice(11, 16) === time) return;
    const dateStr = task.date.slice(0, 10);
    handleTaskUpdated({ ...task, date: `${dateStr}T${time}:00.000Z` });
    try {
      const res = await fetch(`/api/task/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: dateStr, time }),
      });
      if (!res.ok) throw new Error("Failed to reschedule");
      const updated: SerializedTask = await res.json();
      if (updated.id !== taskId) {
        handleTaskReplaced(taskId, updated);
      } else {
        handleTaskUpdated(updated);
      }
      toast.success(t("task_rescheduled"));
    } catch {
      handleTaskUpdated(task);
      toast.error(t("task_reschedule_error"));
    }
  }

  function handleSeriesDeleted(recurringTaskId: string) {
    setTasks((prev) =>
      prev.filter((t) => t.recurringTaskId !== recurringTaskId),
    );
  }

  function handleSeriesUpdated(
    recurringTaskId: string,
    changes: Pick<
      SerializedTask,
      "title" | "categoryId" | "notes" | "category"
    >,
  ) {
    setTasks((prev) =>
      prev.map((t) =>
        t.recurringTaskId === recurringTaskId ? { ...t, ...changes } : t,
      ),
    );
  }

  function handleCategoryCreated(category: SerializedCategory) {
    setCategories((prev) => [...prev, category]);
  }

  function handleCategoryRenamed(id: string, newName: string) {
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, name: newName } : c)),
    );
    setTasks((prev) =>
      prev.map((t) =>
        t.category?.id === id
          ? { ...t, category: { ...t.category, name: newName } }
          : t,
      ),
    );
  }

  function handleCategoryPinToggled(id: string, pinned: boolean) {
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, pinned } : c)),
    );
  }

  function handleCategoryDeleted(id: string) {
    setCategories((prev) => prev.filter((c) => c.id !== id));
    setTasks((prev) =>
      prev.map((t) =>
        t.categoryId === id ? { ...t, categoryId: null, category: null } : t,
      ),
    );
    if (activeCategoryId === id) setActiveCategoryId(null);
    toast.success("Category deleted");
  }

  async function handleCreateCategory() {
    if (!newCategoryName.trim()) return;
    setCreatingCategory(true);
    const res = await fetch("/api/category", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newCategoryName.trim(),
        color: newCategoryColor,
      }),
    });
    const category: SerializedCategory = await res.json();
    setCreatingCategory(false);
    handleCategoryCreated(category);
    setShowCategoryForm(false);
    setNewCategoryName("");
    setNewCategoryColor(CATEGORY_COLORS[0]);
    toast.success(t("cat_created"));
  }

  const visibleTasks = activeCategoryId
    ? tasks.filter((t) => t.categoryId === activeCategoryId)
    : tasks;

  const datedVisibleTasks = visibleTasks.filter((t) => t.date !== null);
  const datedTeamTasks = teamTasks.filter((t) => t.date !== null);

  const onCurrentWeek = isCurrentWeek(days);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        {view === "week" ? (
          <div className="flex items-center gap-1">
            <button
              onClick={() => navigate(-1)}
              disabled={fetching}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-40 transition"
              aria-label={t("week_prev")}
            >
              ←
            </button>
            <h1 className="min-w-[8rem] text-center text-sm font-semibold text-gray-900 dark:text-gray-100 sm:min-w-[12rem] sm:text-lg">
              {rangeLabel}
            </h1>
            <button
              onClick={() => navigate(1)}
              disabled={fetching}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-40 transition"
              aria-label={t("week_next")}
            >
              →
            </button>
          </div>
        ) : view === "day" ? (
          <div className="flex items-center gap-1">
            <button
              onClick={() => navigateDay(-1)}
              disabled={fetching}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-40 transition"
              aria-label={t("week_prev_day")}
            >
              ←
            </button>
            <h1 className="min-w-[10rem] text-center text-sm font-semibold text-gray-900 dark:text-gray-100 sm:text-lg">
              {dayHeaderLabel}
            </h1>
            <button
              onClick={() => navigateDay(1)}
              disabled={fetching}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-40 transition"
              aria-label={t("week_next_day")}
            >
              →
            </button>
          </div>
        ) : (
          <div />
        )}
        <div className="flex items-center gap-2">
          {(view === "week" || view === "day") && (
            <button
              onClick={goToday}
              disabled={onCurrentWeek}
              className={`rounded-lg border px-3 py-1.5 text-sm transition ${
                onCurrentWeek
                  ? "border-transparent text-gray-300 dark:text-gray-600 cursor-default"
                  : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
            >
              {t("week_today")}
            </button>
          )}
          <div className="flex overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 text-sm">
            <button
              onClick={() => setView("week")}
              className={`px-3 py-1.5 transition ${
                view === "week"
                  ? "bg-primary text-white"
                  : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
            >
              {t("week_view_week")}
            </button>
            <button
              onClick={() => setView("day")}
              className={`px-3 py-1.5 transition ${
                view === "day"
                  ? "bg-primary text-white"
                  : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
            >
              {t("week_view_day")}
            </button>
            <button
              onClick={() => setView("month")}
              className={`px-3 py-1.5 transition ${
                view === "month"
                  ? "bg-primary text-white"
                  : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
            >
              {t("week_view_month")}
            </button>
          </div>
        </div>
      </div>

      {/* Category filter */}
      <div className="flex flex-col gap-2">
        <div className="flex overflow-x-auto items-center gap-2 pb-1 sm:flex-wrap sm:overflow-x-visible sm:pb-0">
          {categories.length > 0 && (
            <button
              onClick={() => setActiveCategoryId(null)}
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition ${
                activeCategoryId === null
                  ? "bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              {t("all")}
            </button>
          )}
          {sortCategories(categories).map((cat) => (
            <button
              key={cat.id}
              onClick={() =>
                setActiveCategoryId(activeCategoryId === cat.id ? null : cat.id)
              }
              onContextMenu={(e) => {
                e.preventDefault();
                setContextMenu({ category: cat, x: e.clientX, y: e.clientY });
              }}
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition ${
                activeCategoryId === cat.id
                  ? (COLOR_CLASSES[cat.color as CategoryColor] ??
                    "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400")
                  : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              {cat.name}
            </button>
          ))}
          <button
            onClick={() => {
              setShowCategoryForm((v) => !v);
              setTimeout(() => categoryNameRef.current?.focus(), 0);
            }}
            className="shrink-0 rounded-full border border-dashed border-gray-300 dark:border-gray-600 px-3 py-1 text-xs text-gray-400 dark:text-gray-500 hover:border-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
          >
            {t("week_new_category")}
          </button>
        </div>

        {showCategoryForm && (
          <div className="flex flex-col gap-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3">
            <input
              ref={categoryNameRef}
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateCategory()}
              placeholder={t("week_category_name_placeholder")}
              className="rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-sm outline-none focus:border-gray-400 dark:focus:border-gray-500 focus:ring-1 focus:ring-gray-200 dark:focus:ring-gray-700"
            />
            <div className="flex flex-wrap gap-1.5">
              {CATEGORY_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setNewCategoryColor(color)}
                  className={`h-5 w-5 rounded-full transition ${SWATCH_CLASSES[color]} ${
                    newCategoryColor === color
                      ? "ring-2 ring-offset-1 ring-primary"
                      : ""
                  }`}
                  aria-label={color}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowCategoryForm(false);
                  setNewCategoryName("");
                }}
                className="rounded-lg px-3 py-1.5 text-xs text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              >
                {t("cancel")}
              </button>
              <button
                disabled={!newCategoryName.trim() || creatingCategory}
                onClick={handleCreateCategory}
                className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-hover disabled:opacity-50 transition"
              >
                {creatingCategory ? t("creating") : t("create")}
              </button>
            </div>
          </div>
        )}
      </div>

      {view === "week" ? (
        <>
          {/* Mobile: single-day view (< sm) */}
          <div
            className={`sm:hidden transition-opacity ${fetching ? "opacity-50" : ""}`}
          >
            <div className="mb-3 flex items-center justify-between">
              <button
                onClick={() => setActiveDayIndex((i) => Math.max(0, i - 1))}
                disabled={activeDayIndex === 0}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-40 transition"
                aria-label={t("week_prev_day")}
              >
                ←
              </button>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {DAY_LABELS_LONG[activeDayIndex]},{" "}
                {days[activeDayIndex].getUTCDate()}
              </span>
              <button
                onClick={() => setActiveDayIndex((i) => Math.min(6, i + 1))}
                disabled={activeDayIndex === 6}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-40 transition"
                aria-label={t("week_next_day")}
              >
                →
              </button>
            </div>
            <DayColumn
              label={DAY_LABELS[activeDayIndex]}
              date={days[activeDayIndex]}
              tasks={datedVisibleTasks.filter(
                (t) =>
                  t.date!.slice(0, 10) ===
                  days[activeDayIndex].toISOString().slice(0, 10),
              )}
              teamTasks={datedTeamTasks.filter(
                (t) =>
                  t.date!.slice(0, 10) ===
                  days[activeDayIndex].toISOString().slice(0, 10),
              )}
              categories={categories}
              onTaskCreated={handleTaskCreated}
              onTaskToggled={handleTaskToggled}
              onTaskUpdated={handleTaskUpdated}
              onTaskDeleted={handleTaskDeleted}
              onTaskReplaced={handleTaskReplaced}
              onSeriesDeleted={handleSeriesDeleted}
              onSeriesUpdated={handleSeriesUpdated}
              onCategoryCreated={handleCategoryCreated}
              onTaskDropped={handleTaskDrop}
            />
          </div>

          {/* Tablet: 7-column horizontal scroll (sm – xl) */}
          <div
            className={`hidden sm:block xl:hidden transition-opacity ${fetching ? "opacity-50" : ""}`}
          >
            <div className="overflow-x-auto pb-2">
              <div className="flex gap-3">
                {days.map((date, i) => {
                  const dateStr = date.toISOString().slice(0, 10);
                  return (
                    <div key={i} className="w-44 flex-none">
                      <DayColumn
                        label={DAY_LABELS[i]}
                        date={date}
                        tasks={datedVisibleTasks.filter(
                          (t) => t.date!.slice(0, 10) === dateStr,
                        )}
                        teamTasks={datedTeamTasks.filter(
                          (t) => t.date!.slice(0, 10) === dateStr,
                        )}
                        categories={categories}
                        onTaskCreated={handleTaskCreated}
                        onTaskToggled={handleTaskToggled}
                        onTaskUpdated={handleTaskUpdated}
                        onTaskDeleted={handleTaskDeleted}
                        onTaskReplaced={handleTaskReplaced}
                        onSeriesDeleted={handleSeriesDeleted}
                        onSeriesUpdated={handleSeriesUpdated}
                        onCategoryCreated={handleCategoryCreated}
                        onTaskDropped={handleTaskDrop}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Desktop: 7-column grid (xl+) */}
          <div
            className={`hidden xl:grid grid-cols-7 gap-3 transition-opacity ${fetching ? "opacity-50" : "opacity-100"}`}
          >
            {days.map((date, i) => {
              const dateStr = date.toISOString().slice(0, 10);
              return (
                <DayColumn
                  key={i}
                  label={DAY_LABELS[i]}
                  date={date}
                  tasks={datedVisibleTasks.filter(
                    (t) => t.date!.slice(0, 10) === dateStr,
                  )}
                  teamTasks={datedTeamTasks.filter(
                    (t) => t.date!.slice(0, 10) === dateStr,
                  )}
                  categories={categories}
                  onTaskCreated={handleTaskCreated}
                  onTaskToggled={handleTaskToggled}
                  onTaskUpdated={handleTaskUpdated}
                  onTaskDeleted={handleTaskDeleted}
                  onTaskReplaced={handleTaskReplaced}
                  onSeriesDeleted={handleSeriesDeleted}
                  onSeriesUpdated={handleSeriesUpdated}
                  onCategoryCreated={handleCategoryCreated}
                  onTaskDropped={handleTaskDrop}
                />
              );
            })}
          </div>
        </>
      ) : view === "day" ? (
        <div
          className={`transition-opacity ${fetching ? "opacity-50" : ""}`}
        >
          <DayTimeline
            date={activeDate}
            tasks={datedVisibleTasks.filter(
              (t) => t.date!.slice(0, 10) === activeDate.toISOString().slice(0, 10),
            )}
            teamTasks={datedTeamTasks.filter(
              (t) => t.date!.slice(0, 10) === activeDate.toISOString().slice(0, 10),
            )}
            categories={categories}
            onTaskCreated={handleTaskCreated}
            onTaskToggled={handleTaskToggled}
            onTaskUpdated={handleTaskUpdated}
            onTaskDeleted={handleTaskDeleted}
            onTaskReplaced={handleTaskReplaced}
            onSeriesDeleted={handleSeriesDeleted}
            onSeriesUpdated={handleSeriesUpdated}
            onCategoryCreated={handleCategoryCreated}
            onTaskDropped={handleHourDrop}
          />
        </div>
      ) : (
        <MonthView
          categories={sortCategories(categories)}
          activeCategoryId={activeCategoryId}
          onCategoryCreated={handleCategoryCreated}
          weekStartsOn={weekStartsOn}
        />
      )}

      {contextMenu && (
        <CategoryContextMenu
          category={contextMenu.category}
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          onRenamed={handleCategoryRenamed}
          onDeleted={handleCategoryDeleted}
          onPinToggled={handleCategoryPinToggled}
        />
      )}
    </div>
  );
}
