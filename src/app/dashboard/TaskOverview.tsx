"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { SerializedTask, SerializedCategory } from "./WeekView";
import TaskItem from "./TaskItem";
import AddTaskModal from "./AddTaskModal";
import { COLOR_CLASSES } from "@/lib/category-colors";
import type { CategoryColor } from "@/lib/category-colors";

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

function getToday(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatDateLabel(dateStr: string): string {
  const today = getToday();
  const d = new Date(today + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + 1);
  const tomorrow = d.toISOString().slice(0, 10);
  if (dateStr === today) return "Today";
  if (dateStr === tomorrow) return "Tomorrow";
  const date = new Date(dateStr + "T00:00:00Z");
  return `${MONTH_NAMES[date.getUTCMonth()]} ${date.getUTCDate()}, ${date.getUTCFullYear()}`;
}

export default function TaskOverview({
  tasks: initialTasks,
  categories: initialCategories,
}: {
  tasks: SerializedTask[];
  categories: SerializedCategory[];
}) {
  const [tasks, setTasks] = useState(initialTasks);
  const [categories, setCategories] = useState(initialCategories);
  const [pastHidden, setPastHidden] = useState(false);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [addTaskOpen, setAddTaskOpen] = useState(false);

  const today = getToday();

  const filteredTasks = activeCategoryId
    ? tasks.filter((t) => t.categoryId === activeCategoryId)
    : tasks;

  const pastTasks = filteredTasks
    .filter((t) => t.date.slice(0, 10) < today)
    .sort((a, b) => b.date.localeCompare(a.date));

  const upcomingTasks = filteredTasks.filter(
    (t) => t.date.slice(0, 10) >= today,
  );

  const pastByDate = pastTasks.reduce<Record<string, SerializedTask[]>>(
    (acc, t) => {
      const d = t.date.slice(0, 10);
      if (!acc[d]) acc[d] = [];
      acc[d].push(t);
      return acc;
    },
    {},
  );
  const pastDates = Object.keys(pastByDate).sort((a, b) => b.localeCompare(a));

  const upcomingByDate = upcomingTasks.reduce<Record<string, SerializedTask[]>>(
    (acc, t) => {
      const d = t.date.slice(0, 10);
      if (!acc[d]) acc[d] = [];
      acc[d].push(t);
      return acc;
    },
    {},
  );
  const upcomingDates = Object.keys(upcomingByDate).sort();

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
  function handleCategoryCreated(cat: SerializedCategory) {
    setCategories((prev) => [...prev, cat]);
  }

  const overdueCount = pastTasks.length;

  return (
    <div className="mx-auto w-full max-w-2xl flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">All Tasks</h1>
        <button
          onClick={() => setAddTaskOpen(true)}
          className="rounded-lg bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-700 transition"
        >
          + Add task
        </button>
      </div>

      {/* Category filter */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
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
        </div>
      )}

      {/* Past tasks */}
      {pastTasks.length > 0 && (
        <div className="flex flex-col gap-3">
          <button
            onClick={() => setPastHidden((v) => !v)}
            className="flex items-center gap-2 group w-fit"
          >
            {pastHidden ? (
              <ChevronRight
                size={15}
                className="text-gray-400 group-hover:text-gray-600 transition"
              />
            ) : (
              <ChevronDown
                size={15}
                className="text-gray-400 group-hover:text-gray-600 transition"
              />
            )}
            <span className="text-sm font-medium text-gray-500 group-hover:text-gray-700 transition">
              Past
            </span>
            {overdueCount > 0 && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                {overdueCount} overdue
              </span>
            )}
            <span className="text-xs text-gray-400">
              {pastTasks.length} task{pastTasks.length !== 1 ? "s" : ""}
            </span>
          </button>

          {!pastHidden && (
            <div className="flex flex-col gap-5 rounded-xl border border-gray-200 bg-white p-4">
              {pastDates.map((dateStr) => (
                <div key={dateStr} className="flex flex-col gap-2">
                  <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    {formatDateLabel(dateStr)}
                  </h2>
                  <div className="flex flex-col gap-2">
                    {pastByDate[dateStr].map((task) => (
                      <TaskItem
                        key={task.id}
                        task={task}
                        categories={categories}
                        onToggled={handleTaskToggled}
                        onUpdated={handleTaskUpdated}
                        onDeleted={handleTaskDeleted}
                        onReplaced={handleTaskReplaced}
                        onSeriesDeleted={handleSeriesDeleted}
                        onSeriesUpdated={handleSeriesUpdated}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Upcoming tasks by date */}
      {upcomingDates.length > 0 ? (
        <div className="flex flex-col gap-6">
          {upcomingDates.map((dateStr) => (
            <div key={dateStr} className="flex flex-col gap-2">
              <h2 className="text-sm font-semibold text-gray-700">
                {formatDateLabel(dateStr)}
              </h2>
              <div className="flex flex-col gap-2">
                {upcomingByDate[dateStr].map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    categories={categories}
                    onToggled={handleTaskToggled}
                    onUpdated={handleTaskUpdated}
                    onDeleted={handleTaskDeleted}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        pastTasks.length === 0 && (
          <div className="py-12 text-center text-sm text-gray-400">
            No tasks yet
          </div>
        )
      )}

      {addTaskOpen && (
        <AddTaskModal
          defaultDate={new Date()}
          onClose={() => setAddTaskOpen(false)}
          onSaved={handleTaskCreated}
          categories={categories}
          onCategoryCreated={handleCategoryCreated}
        />
      )}
    </div>
  );
}
