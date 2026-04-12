"use client";

import { useEffect, useRef, useState } from "react";
import DayColumn from "./DayColumn";
import {
  CATEGORY_COLORS,
  COLOR_CLASSES,
  SWATCH_CLASSES,
} from "@/lib/category-colors";
import type { CategoryColor } from "@/lib/category-colors";

export type SerializedCategory = {
  id: string;
  name: string;
  color: string;
};

export type SerializedTask = {
  id: string;
  title: string;
  categoryId: string;
  category: SerializedCategory | null;
  notes: string | null;
  done: boolean;
  date: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
};

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

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
  weekStart: initialWeekStart,
}: {
  tasks: SerializedTask[];
  weekStart: string;
}) {
  const [weekStart, setWeekStart] = useState(initialWeekStart);
  const [tasks, setTasks] = useState(initialTasks);
  const [fetching, setFetching] = useState(false);
  const [categories, setCategories] = useState<SerializedCategory[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState<CategoryColor>(
    CATEGORY_COLORS[0],
  );
  const [creatingCategory, setCreatingCategory] = useState(false);
  const categoryNameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/category")
      .then((r) => r.json())
      .then(setCategories);
  }, []);

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
    await fetchWeek(next);
  }

  async function goToday() {
    const today = getCurrentWeekStart();
    setWeekStart(today);
    await fetchWeek(today);
  }

  function handleTaskCreated(task: SerializedTask) {
    setTasks((prev) => [...prev, task]);
  }

  function handleTaskToggled(id: string, done: boolean) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done } : t)));
  }

  function handleTaskDeleted(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }

  function handleCategoryCreated(category: SerializedCategory) {
    setCategories((prev) => [...prev, category]);
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
  }

  const visibleTasks = activeCategoryId
    ? tasks.filter((t) => t.categoryId === activeCategoryId)
    : tasks;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">{rangeLabel}</h1>
        <div className="flex items-center gap-2">
          {!isCurrentWeek(days) && (
            <button
              onClick={goToday}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 transition"
            >
              Today
            </button>
          )}
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
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {categories.length > 0 && (
            <button
              onClick={() => setActiveCategoryId(null)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
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
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
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
            className="rounded-full border border-dashed border-gray-300 px-3 py-1 text-xs text-gray-400 hover:border-gray-400 hover:text-gray-600 transition"
          >
            + Category
          </button>
        </div>

        {showCategoryForm && (
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3">
            <input
              ref={categoryNameRef}
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateCategory()}
              placeholder="Category name"
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-200"
            />
            <div className="flex gap-1.5">
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

      <div
        className={`grid grid-cols-7 gap-3 transition-opacity ${fetching ? "opacity-50" : "opacity-100"}`}
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
              onTaskDeleted={handleTaskDeleted}
              onCategoryCreated={handleCategoryCreated}
            />
          );
        })}
      </div>
    </div>
  );
}
