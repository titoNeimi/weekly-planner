"use client";

import { useRef, useState } from "react";
import DayColumn from "./DayColumn";
import MonthView from "./MonthView";
import {
  CATEGORY_COLORS,
  COLOR_CLASSES,
  SWATCH_CLASSES,
} from "@/lib/category-colors";
import type { CategoryColor } from "@/lib/category-colors";
import CategoryContextMenu from "@/components/category-context-menu";
import { toast } from "sonner";

export type SerializedCategory = {
  id: string;
  name: string;
  color: string;
};

export type SerializedTask = {
  id: string;
  title: string;
  categoryId: string | null;
  category: SerializedCategory | null;
  notes: string | null;
  done: boolean;
  date: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
};

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY_LABELS_LONG = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

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
  const todayUTC = new Date().toISOString().slice(0, 10);
  return days.some((d) => d.toISOString().slice(0, 10) === todayUTC);
}

function getCurrentWeekStart(): string {
  const now = new Date();
  const day = now.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setUTCDate(now.getUTCDate() + diff);
  monday.setUTCHours(0, 0, 0, 0);
  return monday.toISOString();
}

export default function WeekView({
  tasks: initialTasks,
  categories: initialCategories,
  weekStart: initialWeekStart,
}: {
  tasks: SerializedTask[];
  categories: SerializedCategory[];
  weekStart: string;
}) {
  const [weekStart, setWeekStart] = useState(initialWeekStart);
  const [tasks, setTasks] = useState(initialTasks);
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
  const [view, setView] = useState<"week" | "month">("week");
  const [activeDayIndex, setActiveDayIndex] = useState<number>(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
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

  async function fetchWeek(start: string) {
    const days = getWeekDays(start);
    const from = days[0].toISOString();
    const to = new Date(days[6]);
    to.setUTCHours(23, 59, 59, 999);

    setFetching(true);
    const res = await fetch(`/api/task?from=${from}&to=${to.toISOString()}`);
    const data: SerializedTask[] = await res.json();
    setTasks(data);
    setFetching(false);
  }

  async function navigate(direction: number) {
    const next = shiftWeek(weekStart, direction);
    setWeekStart(next);
    setActiveDayIndex(0);
    await fetchWeek(next);
  }

  async function goToday() {
    const today = getCurrentWeekStart();
    setWeekStart(today);
    const todayStr = new Date().toISOString().slice(0, 10);
    const idx = getWeekDays(today).findIndex(
      (d) => d.toISOString().slice(0, 10) === todayStr,
    );
    setActiveDayIndex(idx >= 0 ? idx : 0);
    await fetchWeek(today);
  }

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
    toast.success("Category created");
  }

  const visibleTasks = activeCategoryId
    ? tasks.filter((t) => t.categoryId === activeCategoryId)
    : tasks;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        {view === "week" ? (
          <h1 className="text-base font-semibold text-gray-900 sm:text-xl">
            {rangeLabel}
          </h1>
        ) : (
          <div />
        )}
        <div className="flex items-center gap-2">
          {view === "week" && !isCurrentWeek(days) && (
            <button
              onClick={goToday}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 transition"
            >
              Today
            </button>
          )}
          {view === "week" && (
            <>
              <button
                onClick={() => navigate(-1)}
                disabled={fetching}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition"
                aria-label="Previous week"
              >
                ←
              </button>
              <button
                onClick={() => navigate(1)}
                disabled={fetching}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition"
                aria-label="Next week"
              >
                →
              </button>
            </>
          )}
          <div className="flex overflow-hidden rounded-lg border border-gray-200 text-sm">
            <button
              onClick={() => setView("week")}
              className={`px-3 py-1.5 transition ${
                view === "week"
                  ? "bg-gray-900 text-white"
                  : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setView("month")}
              className={`px-3 py-1.5 transition ${
                view === "month"
                  ? "bg-gray-900 text-white"
                  : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              Month
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
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              All
            </button>
          )}
          {categories.map((cat) => (
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
                    "bg-gray-100 text-gray-600")
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
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
            className="shrink-0 rounded-full border border-dashed border-gray-300 px-3 py-1 text-xs text-gray-400 hover:border-gray-400 hover:text-gray-600 transition"
          >
            + Category
          </button>
        </div>

        {showCategoryForm && (
          <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3">
            <input
              ref={categoryNameRef}
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateCategory()}
              placeholder="Category name"
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-200"
            />
            <div className="flex flex-wrap gap-1.5">
              {CATEGORY_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setNewCategoryColor(color)}
                  className={`h-5 w-5 rounded-full transition ${SWATCH_CLASSES[color]} ${
                    newCategoryColor === color
                      ? "ring-2 ring-offset-1 ring-gray-500"
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
                className="rounded-lg px-3 py-1.5 text-xs text-gray-400 hover:bg-gray-100 transition"
              >
                Cancel
              </button>
              <button
                disabled={!newCategoryName.trim() || creatingCategory}
                onClick={handleCreateCategory}
                className="rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-700 disabled:opacity-50 transition"
              >
                {creatingCategory ? "Creating…" : "Create"}
              </button>
            </div>
          </div>
        )}
      </div>

      {view === "week" ? (
        <>
          {/* Mobile: single-day view (< sm) */}
          <div className={`sm:hidden transition-opacity ${fetching ? "opacity-50" : ""}`}>
            <div className="mb-3 flex items-center justify-between">
              <button
                onClick={() => setActiveDayIndex((i) => Math.max(0, i - 1))}
                disabled={activeDayIndex === 0}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition"
                aria-label="Previous day"
              >
                ←
              </button>
              <span className="text-sm font-medium text-gray-700">
                {DAY_LABELS_LONG[activeDayIndex]},{" "}
                {days[activeDayIndex].getUTCDate()}
              </span>
              <button
                onClick={() => setActiveDayIndex((i) => Math.min(6, i + 1))}
                disabled={activeDayIndex === 6}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition"
                aria-label="Next day"
              >
                →
              </button>
            </div>
            <DayColumn
              label={DAY_LABELS[activeDayIndex]}
              date={days[activeDayIndex]}
              tasks={visibleTasks.filter(
                (t) =>
                  t.date.slice(0, 10) ===
                  days[activeDayIndex].toISOString().slice(0, 10),
              )}
              categories={categories}
              onTaskCreated={handleTaskCreated}
              onTaskToggled={handleTaskToggled}
              onTaskUpdated={handleTaskUpdated}
              onTaskDeleted={handleTaskDeleted}
              onCategoryCreated={handleCategoryCreated}
            />
          </div>

          {/* Medium: 3-column view (sm – 2xl) */}
          {(() => {
            const chunkStart = Math.floor(activeDayIndex / 3) * 3;
            const chunkDays = days.slice(chunkStart, chunkStart + 3);
            const chunkLabel =
              chunkDays.length === 1
                ? `${DAY_LABELS_LONG[chunkStart]} ${chunkDays[0].getUTCDate()}`
                : `${DAY_LABELS_LONG[chunkStart]} ${chunkDays[0].getUTCDate()} – ${DAY_LABELS_LONG[chunkStart + chunkDays.length - 1]} ${chunkDays[chunkDays.length - 1].getUTCDate()}`;
            return (
              <div className={`hidden sm:flex 2xl:hidden flex-col gap-3 transition-opacity ${fetching ? "opacity-50" : ""}`}>
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setActiveDayIndex(Math.max(0, chunkStart - 3))}
                    disabled={chunkStart === 0}
                    className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition"
                    aria-label="Previous days"
                  >
                    ←
                  </button>
                  <span className="text-sm font-medium text-gray-700">{chunkLabel}</span>
                  <button
                    onClick={() => setActiveDayIndex(Math.min(6, chunkStart + 3))}
                    disabled={chunkStart + 3 >= 7}
                    className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition"
                    aria-label="Next days"
                  >
                    →
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {chunkDays.map((date, i) => {
                    const dayTasks = visibleTasks.filter(
                      (t) => t.date.slice(0, 10) === date.toISOString().slice(0, 10),
                    );
                    return (
                      <DayColumn
                        key={chunkStart + i}
                        label={DAY_LABELS[chunkStart + i]}
                        date={date}
                        tasks={dayTasks}
                        categories={categories}
                        onTaskCreated={handleTaskCreated}
                        onTaskToggled={handleTaskToggled}
                        onTaskUpdated={handleTaskUpdated}
                        onTaskDeleted={handleTaskDeleted}
                        onCategoryCreated={handleCategoryCreated}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* Desktop: 7-column grid (2xl+) */}
          <div
            className={`hidden 2xl:grid grid-cols-7 gap-3 transition-opacity ${fetching ? "opacity-50" : "opacity-100"}`}
          >
            {days.map((date, i) => {
              const dayTasks = visibleTasks.filter(
                (t) => t.date.slice(0, 10) === date.toISOString().slice(0, 10),
              );
              return (
                <DayColumn
                  key={i}
                  label={DAY_LABELS[i]}
                  date={date}
                  tasks={dayTasks}
                  categories={categories}
                  onTaskCreated={handleTaskCreated}
                  onTaskToggled={handleTaskToggled}
                  onTaskUpdated={handleTaskUpdated}
                  onTaskDeleted={handleTaskDeleted}
                  onCategoryCreated={handleCategoryCreated}
                />
              );
            })}
          </div>
        </>
      ) : (
        <MonthView
          categories={categories}
          activeCategoryId={activeCategoryId}
          onCategoryCreated={handleCategoryCreated}
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
        />
      )}
    </div>
  );
}
