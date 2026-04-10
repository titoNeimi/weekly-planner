"use client";

import { useState } from "react";
import DayColumn from "./DayColumn";

export type SerializedTask = {
  id: string;
  title: string;
  category: string;
  notes: string | null;
  done: boolean;
  date: string;
  userId: string;
  createdAt: string;
};

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
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

      <div className={`grid grid-cols-7 gap-3 transition-opacity ${fetching ? "opacity-50" : "opacity-100"}`}>
        {days.map((date, i) => {
          const dayTasks = tasks.filter(
            (t) => t.date.slice(0, 10) === date.toISOString().slice(0, 10)
          );
          return (
            <DayColumn
              key={i}
              label={DAY_LABELS[i]}
              date={date}
              tasks={dayTasks}
              onTaskCreated={handleTaskCreated}
              onTaskToggled={handleTaskToggled}
              onTaskDeleted={handleTaskDeleted}
            />
          );
        })}
      </div>
    </div>
  );
}
