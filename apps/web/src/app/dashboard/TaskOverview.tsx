"use client";

import { useState } from "react";
import type {
  SerializedTask,
  SerializedCategory,
  SerializedTeamTask,
} from "./WeekView";
import TaskItem from "./TaskItem";
import TeamTaskItem from "./TeamTaskItem";
import AddTaskModal from "./AddTaskModal";
import { COLOR_CLASSES } from "@/lib/category-colors";
import type { CategoryColor } from "@/lib/category-colors";
import { getLocalTodayStr } from "@/lib/date";
import { useLanguage } from "@/context/LanguageContext";

export default function TaskOverview({
  tasks: initialTasks,
  teamTasks,
  categories: initialCategories,
}: {
  tasks: SerializedTask[];
  teamTasks: SerializedTeamTask[];
  categories: SerializedCategory[];
}) {
  const [tasks, setTasks] = useState(initialTasks);
  const [categories, setCategories] = useState(initialCategories);
  const [pastHidden, setPastHidden] = useState(false);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [addTaskOpen, setAddTaskOpen] = useState(false);
  const { t, ta, tpl } = useLanguage();

  const today = getLocalTodayStr();

  function formatDateLabel(dateStr: string): string {
    const d = new Date(today + "T00:00:00Z");
    d.setUTCDate(d.getUTCDate() + 1);
    const tomorrow = d.toISOString().slice(0, 10);
    if (dateStr === today) return t("overview_today");
    if (dateStr === tomorrow) return t("overview_tomorrow");
    const date = new Date(dateStr + "T00:00:00Z");
    const months = ta("months");
    return `${months[date.getUTCMonth()]} ${date.getUTCDate()}, ${date.getUTCFullYear()}`;
  }

  const filteredTasks = activeCategoryId
    ? tasks.filter((t) => t.categoryId === activeCategoryId)
    : tasks;

  const undatedTasks = filteredTasks.filter((t) => t.date === null);
  const datedTasks = filteredTasks.filter((t) => t.date !== null) as Array<
    SerializedTask & { date: string }
  >;

  const pastTasks = datedTasks
    .filter((t) => t.date.slice(0, 10) < today)
    .sort((a, b) => b.date.localeCompare(a.date));

  const upcomingTasks = datedTasks.filter(
    (t) => t.date.slice(0, 10) >= today,
  );

  const undatedTeamTasks = teamTasks.filter((t) => t.date === null);
  const datedTeamTasks = teamTasks.filter((t) => t.date !== null) as Array<
    SerializedTeamTask & { date: string }
  >;

  const pastTeamTasks = datedTeamTasks.filter((t) => t.date.slice(0, 10) < today);
  const upcomingTeamTasks = datedTeamTasks.filter(
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
  const pastTeamByDate = pastTeamTasks.reduce<
    Record<string, SerializedTeamTask[]>
  >((acc, t) => {
    const d = t.date.slice(0, 10);
    if (!acc[d]) acc[d] = [];
    acc[d].push(t);
    return acc;
  }, {});
  const pastDates = [
    ...new Set([...Object.keys(pastByDate), ...Object.keys(pastTeamByDate)]),
  ].sort((a, b) => b.localeCompare(a));

  const upcomingByDate = upcomingTasks.reduce<Record<string, SerializedTask[]>>(
    (acc, t) => {
      const d = t.date.slice(0, 10);
      if (!acc[d]) acc[d] = [];
      acc[d].push(t);
      return acc;
    },
    {},
  );
  const upcomingTeamByDate = upcomingTeamTasks.reduce<
    Record<string, SerializedTeamTask[]>
  >((acc, t) => {
    const d = t.date.slice(0, 10);
    if (!acc[d]) acc[d] = [];
    acc[d].push(t);
    return acc;
  }, {});
  const upcomingDates = [
    ...new Set([
      ...Object.keys(upcomingByDate),
      ...Object.keys(upcomingTeamByDate),
    ]),
  ].sort();

  const todayTaskCount =
    (upcomingByDate[today] ?? []).length +
    (upcomingTeamByDate[today] ?? []).length;

  const hasUndated = undatedTasks.length > 0 || undatedTeamTasks.length > 0;

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

  const overdueCount = pastTasks.length + pastTeamTasks.length;

  const taskItemProps = {
    categories,
    onToggled: handleTaskToggled,
    onUpdated: handleTaskUpdated,
    onDeleted: handleTaskDeleted,
    onReplaced: handleTaskReplaced,
    onCreated: handleTaskCreated,
    onSeriesDeleted: handleSeriesDeleted,
    onSeriesUpdated: handleSeriesUpdated,
  };

  const isEmpty =
    upcomingDates.length === 0 && pastDates.length === 0 && !hasUndated;

  return (
    <div className="mx-auto w-full max-w-2xl flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{t("overview_title")}</h1>
          {todayTaskCount > 0 && (
            <p className="mt-0.5 text-sm text-gray-400">
              {tpl("overview_for_today", { n: todayTaskCount })}
            </p>
          )}
        </div>
        <button
          onClick={() => setAddTaskOpen(true)}
          className="shrink-0 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-hover transition"
        >
          {t("overview_add_task")}
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
            {t("all")}
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

      {/* Upcoming tasks by date */}
      {upcomingDates.length > 0 ? (
        <div className="flex flex-col gap-8">
          {upcomingDates.map((dateStr) => {
            const isToday = dateStr === today;
            const dateTasks = upcomingByDate[dateStr] ?? [];
            const dateTeamTasks = upcomingTeamByDate[dateStr] ?? [];

            if (isToday) {
              return (
                <div
                  key={dateStr}
                  className="flex flex-col gap-3 rounded-xl bg-primary-light px-4 py-3"
                >
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-semibold text-primary">
                      {t("overview_today")}
                    </h2>
                    <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-primary">
                      {dateTasks.length + dateTeamTasks.length}
                    </span>
                  </div>
                  <div className="flex flex-col gap-2.5">
                    {dateTasks.map((task) => (
                      <TaskItem key={task.id} task={task} {...taskItemProps} />
                    ))}
                    {dateTeamTasks.map((task) => (
                      <TeamTaskItem key={task.id} task={task} />
                    ))}
                  </div>
                </div>
              );
            }

            return (
              <div key={dateStr} className="flex flex-col gap-2.5">
                <h2 className="text-sm font-medium text-gray-500">
                  {formatDateLabel(dateStr)}
                </h2>
                <div className="flex flex-col gap-2.5">
                  {dateTasks.map((task) => (
                    <TaskItem key={task.id} task={task} {...taskItemProps} />
                  ))}
                  {dateTeamTasks.map((task) => (
                    <TeamTaskItem key={task.id} task={task} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        !hasUndated && pastDates.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-sm text-gray-400">{t("overview_nothing_planned")}</p>
            <button
              onClick={() => setAddTaskOpen(true)}
              className="mt-3 text-sm text-primary hover:underline transition"
            >
              {t("overview_add_first")}
            </button>
          </div>
        )
      )}

      {/* Past tasks — divider-row toggle */}
      {pastDates.length > 0 && (
        <div className="flex flex-col gap-5">
          <button
            onClick={() => setPastHidden((v) => !v)}
            className="group flex items-center gap-3"
          >
            <div className="h-px flex-1 bg-gray-200 transition group-hover:bg-gray-300" />
            <span className="flex items-center gap-2 text-xs text-gray-400 transition group-hover:text-gray-600">
              {t("overview_past")}
              {overdueCount > 0 && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                  {tpl("overview_overdue", { n: overdueCount })}
                </span>
              )}
            </span>
            <span className="text-xs text-gray-300 transition group-hover:text-gray-500">
              {pastHidden ? "↓" : "↑"}
            </span>
            <div className="h-px flex-1 bg-gray-200 transition group-hover:bg-gray-300" />
          </button>

          {!pastHidden && (
            <div className="flex flex-col gap-6">
              {pastDates.map((dateStr) => (
                <div key={dateStr} className="flex flex-col gap-2.5">
                  <h2 className="text-xs font-medium text-gray-400">
                    {formatDateLabel(dateStr)}
                  </h2>
                  <div className="flex flex-col gap-2.5">
                    {(pastByDate[dateStr] ?? []).map((task) => (
                      <TaskItem key={task.id} task={task} {...taskItemProps} />
                    ))}
                    {(pastTeamByDate[dateStr] ?? []).map((task) => (
                      <TeamTaskItem key={task.id} task={task} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Undated tasks */}
      {hasUndated && (
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-gray-100" />
            <span className="text-xs font-medium text-gray-400">{t("undated_section")}</span>
            <div className="h-px flex-1 bg-gray-100" />
          </div>
          <div className="flex flex-col gap-2.5">
            {undatedTasks.map((task) => (
              <TaskItem key={task.id} task={task} {...taskItemProps} />
            ))}
            {undatedTeamTasks.map((task) => (
              <TeamTaskItem key={task.id} task={task} />
            ))}
          </div>
        </div>
      )}

      {isEmpty && (
        <div className="py-16 text-center">
          <p className="text-sm text-gray-400">{t("overview_nothing_planned")}</p>
          <button
            onClick={() => setAddTaskOpen(true)}
            className="mt-3 text-sm text-primary hover:underline transition"
          >
            {t("overview_add_first")}
          </button>
        </div>
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
