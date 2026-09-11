"use client";

import { useState } from "react";
import type {
  SerializedTask,
  SerializedCategory,
  SerializedTeamTask,
} from "./WeekView";
import TaskItem from "./TaskItem";
import AddTaskModal from "./AddTaskModal";
import TodayHero from "./TodayHero";
import OverdueBanner from "./OverdueBanner";
import AssignedToYouSection from "./AssignedToYouSection";
import WeekStrip from "./WeekStrip";
import DashboardSidebar from "./DashboardSidebar";
import { toast } from "sonner";
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
  const pastDates = Object.keys(pastByDate).sort((a, b) => b.localeCompare(a));
  const pastTeamDates = Object.keys(pastTeamByDate).sort((a, b) =>
    b.localeCompare(a),
  );

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
  const upcomingDates = Object.keys(upcomingByDate).sort();
  const upcomingTeamDates = Object.keys(upcomingTeamByDate).sort();

  const todayTasks = upcomingByDate[today] ?? [];
  const otherUpcomingDates = upcomingDates.filter((d) => d !== today);

  const daysLong = ta("days_long");
  const months = ta("months");
  const todayDateObj = new Date(`${today}T00:00:00Z`);
  const todayDayIdx = (todayDateObj.getUTCDay() + 6) % 7;
  const todayDateLabel = `${daysLong[todayDayIdx]}, ${months[todayDateObj.getUTCMonth()]} ${todayDateObj.getUTCDate()}`;

  const hasUndated = undatedTasks.length > 0;

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

  async function handleRescheduleAllOverdue() {
    const todayStr = getLocalTodayStr();
    const results = await Promise.allSettled(
      pastTasks.map(async (task) => {
        const time = task.date.slice(11, 16);
        const res = await fetch(`/api/task/${task.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date: todayStr, time }),
        });
        if (!res.ok) throw new Error("Failed to reschedule");
        const updated: SerializedTask = await res.json();
        handleTaskReplaced(task.id, updated);
      }),
    );
    const failed = results.filter((r) => r.status === "rejected").length;
    if (failed > 0) {
      toast.error(tpl("overdue_banner_partial_error", { n: failed }));
    } else {
      toast.success(tpl("overdue_banner_success", { n: pastTasks.length }));
    }
  }

  const overdueCount = pastTasks.length;

  function handleViewOverdue() {
    setPastHidden(false);
    setTimeout(() => {
      document
        .getElementById("past-tasks")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  }

  async function handleMarkAllPastDone() {
    const ids = pastTasks.map((t) => t.id);
    if (ids.length === 0) return;
    setTasks((prev) =>
      prev.map((t) => (ids.includes(t.id) ? { ...t, done: true } : t)),
    );
    const results = await Promise.allSettled(
      ids.map((id) =>
        fetch(`/api/task/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ done: true }),
        }),
      ),
    );
    const failed = results.filter((r) => r.status === "rejected").length;
    if (failed > 0) {
      toast.error(tpl("overdue_banner_partial_error", { n: failed }));
    } else {
      toast.success(tpl("past_mark_all_done_success", { n: ids.length }));
    }
  }

  async function handleClearAllPast() {
    const ids = pastTasks.map((t) => t.id);
    if (ids.length === 0) return;
    if (!confirm(tpl("past_clear_all_confirm", { n: ids.length }))) return;
    setTasks((prev) => prev.filter((t) => !ids.includes(t.id)));
    await Promise.allSettled(
      ids.map((id) => fetch(`/api/task/${id}`, { method: "DELETE" })),
    );
    toast.success(tpl("past_clear_all_success", { n: ids.length }));
  }

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

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 lg:mx-0 lg:max-w-none lg:flex-1">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-xl font-semibold text-gray-900">{t("overview_title")}</h1>
          <button
            onClick={() => setAddTaskOpen(true)}
            className="shrink-0 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-hover transition"
          >
            {t("overview_add_task")}
          </button>
        </div>

        <WeekStrip tasks={tasks} teamTasks={teamTasks} />

        <OverdueBanner count={overdueCount} onRescheduleAll={handleRescheduleAllOverdue} />

        <TodayHero
          dateLabel={todayDateLabel}
          tasks={todayTasks}
          taskItemProps={taskItemProps}
          onQuickAdd={handleTaskCreated}
        />

        {/* Category filter — sidebar takes over on wide screens */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2 lg:hidden">
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

        {/* Upcoming tasks by date (today lives in the hero above) */}
        {otherUpcomingDates.length > 0 && (
          <div className="flex flex-col gap-8">
            {otherUpcomingDates.map((dateStr) => {
              const dateTasks = upcomingByDate[dateStr] ?? [];

              return (
                <div key={dateStr} className="flex flex-col gap-2.5">
                  <h2 className="text-sm font-medium text-gray-500">
                    {formatDateLabel(dateStr)}
                  </h2>
                  <div className="flex flex-col gap-2.5">
                    {dateTasks.map((task) => (
                      <TaskItem key={task.id} task={task} {...taskItemProps} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Past tasks — divider-row toggle */}
        {pastDates.length > 0 && (
          <div id="past-tasks" className="flex scroll-mt-20 flex-col gap-5">
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
                <div className="-mt-1 flex justify-end gap-4">
                  <button
                    onClick={handleMarkAllPastDone}
                    className="text-xs font-medium text-gray-400 hover:text-gray-700 transition"
                  >
                    {t("past_mark_all_done")}
                  </button>
                  <button
                    onClick={handleClearAllPast}
                    className="text-xs font-medium text-gray-400 hover:text-red-500 transition"
                  >
                    {t("past_clear_all")}
                  </button>
                </div>
                {pastDates.map((dateStr) => (
                  <div key={dateStr} className="flex flex-col gap-2.5">
                    <h2 className="text-xs font-medium text-gray-400">
                      {formatDateLabel(dateStr)}
                    </h2>
                    <div className="flex flex-col gap-2.5">
                      {(pastByDate[dateStr] ?? []).map((task) => (
                        <TaskItem key={task.id} task={task} {...taskItemProps} />
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
            </div>
          </div>
        )}

        <AssignedToYouSection
          upcomingDates={upcomingTeamDates}
          upcomingByDate={upcomingTeamByDate}
          pastDates={pastTeamDates}
          pastByDate={pastTeamByDate}
          undatedTasks={undatedTeamTasks}
          formatDateLabel={formatDateLabel}
        />
      </div>

      <DashboardSidebar
        categories={categories}
        activeCategoryId={activeCategoryId}
        onCategoryChange={setActiveCategoryId}
        tasks={tasks}
        overdueTasks={pastTasks}
        overdueCount={overdueCount}
        onRescheduleAll={handleRescheduleAllOverdue}
        onViewOverdue={handleViewOverdue}
      />

      {addTaskOpen && (
        <AddTaskModal
          defaultDate={new Date(`${getLocalTodayStr()}T00:00:00.000Z`)}
          onClose={() => setAddTaskOpen(false)}
          onSaved={handleTaskCreated}
          categories={categories}
          onCategoryCreated={handleCategoryCreated}
        />
      )}
    </div>
  );
}
