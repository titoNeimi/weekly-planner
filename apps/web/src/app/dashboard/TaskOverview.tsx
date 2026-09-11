"use client";

import { useEffect, useState } from "react";
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
import CategoryContextMenu from "@/components/category-context-menu";
import { toast } from "sonner";
import { COLOR_CLASSES } from "@/lib/category-colors";
import type { CategoryColor } from "@/lib/category-colors";
import { getLocalTodayStr, addDaysToDateStr } from "@/lib/date";
import { sortCategories } from "@/lib/categories";
import type { WeekStartsOn } from "@/lib/week";
import { useLanguage } from "@/context/LanguageContext";
import { useDensity } from "@/context/DensityContext";
import { undoableAction } from "@/lib/undo-toast";
import { isTypingTarget, hasModifier } from "@/lib/keyboard";

export default function TaskOverview({
  tasks: initialTasks,
  teamTasks,
  categories: initialCategories,
  weekStartsOn = 1,
}: {
  tasks: SerializedTask[];
  teamTasks: SerializedTeamTask[];
  categories: SerializedCategory[];
  weekStartsOn?: WeekStartsOn;
}) {
  const [tasks, setTasks] = useState(initialTasks);
  const [categories, setCategories] = useState(initialCategories);
  const [pastHidden, setPastHidden] = useState(false);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [addTaskOpen, setAddTaskOpen] = useState(false);
  const [categoryContextMenu, setCategoryContextMenu] = useState<{
    category: SerializedCategory;
    x: number;
    y: number;
  } | null>(null);
  const { t, ta, tpl } = useLanguage();
  const { density } = useDensity();

  // "n" opens the new-task modal, as long as the user isn't typing somewhere
  // (an input, a modal, the command palette) and no modal is already open.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (
        e.key.toLowerCase() === "n" &&
        !hasModifier(e) &&
        !isTypingTarget(e.target) &&
        !addTaskOpen
      ) {
        e.preventDefault();
        setAddTaskOpen(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [addTaskOpen]);
  const listGap = density === "compact" ? "gap-1" : "gap-2.5";

  const today = getLocalTodayStr();

  function formatDateLabel(dateStr: string): string {
    const tomorrow = addDaysToDateStr(today, 1);
    if (dateStr === today) return t("overview_today");
    if (dateStr === tomorrow) return t("overview_tomorrow");
    const date = new Date(dateStr + "T00:00:00Z");
    const months = ta("months");
    return `${months[date.getUTCMonth()]} ${date.getUTCDate()}, ${date.getUTCFullYear()}`;
  }

  const activeCategory = activeCategoryId
    ? (categories.find((c) => c.id === activeCategoryId) ?? null)
    : null;

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
    toast.success(t("cat_deleted"));
  }
  function handleCategoryPinToggled(id: string, pinned: boolean) {
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, pinned } : c)),
    );
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

  const overdueCount = pastTasks.length + pastTeamTasks.length;

  function handleViewOverdue() {
    setPastHidden(false);
    setTimeout(() => {
      document
        .getElementById("past-tasks")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  }

  function handleMarkAllPastDone() {
    const ids = pastTasks.map((t) => t.id);
    if (ids.length === 0) return;
    setTasks((prev) =>
      prev.map((t) => (ids.includes(t.id) ? { ...t, done: true } : t)),
    );
    undoableAction({
      message: tpl("past_mark_all_done_success", { n: ids.length }),
      undoLabel: t("toast_undo"),
      commit: async () => {
        const results = await Promise.allSettled(
          ids.map(async (id) => {
            const res = await fetch(`/api/task/${id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ done: true }),
            });
            if (!res.ok) throw new Error("Failed to mark task done");
          }),
        );
        const failed = results.filter((r) => r.status === "rejected").length;
        if (failed > 0) {
          toast.error(tpl("overdue_banner_partial_error", { n: failed }));
        }
      },
      rollback: () => {
        setTasks((prev) =>
          prev.map((t) => (ids.includes(t.id) ? { ...t, done: false } : t)),
        );
      },
    });
  }

  function handleClearAllPast() {
    const ids = pastTasks.map((t) => t.id);
    if (ids.length === 0) return;
    if (!confirm(tpl("past_clear_all_confirm", { n: ids.length }))) return;
    const removed = tasks.filter((t) => ids.includes(t.id));
    setTasks((prev) => prev.filter((t) => !ids.includes(t.id)));
    undoableAction({
      message: tpl("past_clear_all_success", { n: ids.length }),
      undoLabel: t("toast_undo"),
      commit: async () => {
        const results = await Promise.allSettled(
          ids.map(async (id) => {
            const res = await fetch(`/api/task/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to delete task");
          }),
        );
        const failed = results.filter((r) => r.status === "rejected").length;
        if (failed > 0) {
          toast.error(tpl("overdue_banner_partial_error", { n: failed }));
        }
      },
      rollback: () => setTasks((prev) => [...prev, ...removed]),
    });
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
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{t("overview_title")}</h1>
          <button
            onClick={() => setAddTaskOpen(true)}
            className="shrink-0 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-hover transition"
          >
            {t("overview_add_task")}
          </button>
        </div>

        <WeekStrip tasks={tasks} teamTasks={teamTasks} weekStartsOn={weekStartsOn} />

        <OverdueBanner count={overdueCount} onRescheduleAll={handleRescheduleAllOverdue} />

        <TodayHero
          dateLabel={todayDateLabel}
          tasks={todayTasks}
          taskItemProps={taskItemProps}
          onQuickAdd={handleTaskCreated}
          emptyMessage={
            activeCategory
              ? tpl("hero_empty_today_filtered", { category: activeCategory.name })
              : undefined
          }
        />

        {/* Category filter — sidebar takes over on wide screens */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2 lg:hidden">
            <button
              onClick={() => setActiveCategoryId(null)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                activeCategoryId === null
                  ? "bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              {t("all")}
            </button>
            {sortCategories(categories).map((cat) => (
              <button
                key={cat.id}
                onClick={() =>
                  setActiveCategoryId(activeCategoryId === cat.id ? null : cat.id)
                }
                onContextMenu={(e) => {
                  e.preventDefault();
                  setCategoryContextMenu({ category: cat, x: e.clientX, y: e.clientY });
                }}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  activeCategoryId === cat.id
                    ? (COLOR_CLASSES[cat.color as CategoryColor] ??
                      "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400")
                    : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}

        {/* Filtered-empty state: a category filter is active but matches nothing */}
        {activeCategory && filteredTasks.length === 0 && (
          <p className="rounded-xl border border-dashed border-gray-200 dark:border-gray-700 px-4 py-6 text-center text-sm text-gray-400 dark:text-gray-500">
            {tpl("overview_filtered_empty", { category: activeCategory.name })}
          </p>
        )}

        {/* Upcoming tasks by date (today lives in the hero above) */}
        {otherUpcomingDates.length > 0 && (
          <div className="flex flex-col gap-8">
            {otherUpcomingDates.map((dateStr) => {
              const dateTasks = upcomingByDate[dateStr] ?? [];

              return (
                <div key={dateStr} className={`flex flex-col ${listGap}`}>
                  <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {formatDateLabel(dateStr)}
                  </h2>
                  <div className={`flex flex-col ${listGap}`}>
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
              <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700 transition group-hover:bg-gray-300 dark:group-hover:bg-gray-600" />
              <span className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500 transition group-hover:text-gray-600 dark:group-hover:text-gray-400">
                {t("overview_past")}
                {overdueCount > 0 && (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                    {tpl("overview_overdue", { n: overdueCount })}
                  </span>
                )}
              </span>
              <span className="text-xs text-gray-300 dark:text-gray-600 transition group-hover:text-gray-500 dark:group-hover:text-gray-400">
                {pastHidden ? "↓" : "↑"}
              </span>
              <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700 transition group-hover:bg-gray-300 dark:group-hover:bg-gray-600" />
            </button>

            {!pastHidden && (
              <div className="flex flex-col gap-6">
                <div className="-mt-1 flex justify-end gap-4">
                  <button
                    onClick={handleMarkAllPastDone}
                    className="text-xs font-medium text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 transition"
                  >
                    {t("past_mark_all_done")}
                  </button>
                  <button
                    onClick={handleClearAllPast}
                    className="text-xs font-medium text-gray-400 dark:text-gray-500 hover:text-red-500 transition"
                  >
                    {t("past_clear_all")}
                  </button>
                </div>
                {pastDates.map((dateStr) => (
                  <div key={dateStr} className={`flex flex-col ${listGap}`}>
                    <h2 className="text-xs font-medium text-gray-400 dark:text-gray-500">
                      {formatDateLabel(dateStr)}
                    </h2>
                    <div className={`flex flex-col ${listGap}`}>
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
          <div className={`flex flex-col ${listGap}`}>
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-gray-100 dark:bg-gray-800" />
              <span className="text-xs font-medium text-gray-400 dark:text-gray-500">{t("undated_section")}</span>
              <div className="h-px flex-1 bg-gray-100 dark:bg-gray-800" />
            </div>
            <div className={`flex flex-col ${listGap}`}>
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
        onCategoryRenamed={handleCategoryRenamed}
        onCategoryDeleted={handleCategoryDeleted}
        onCategoryPinToggled={handleCategoryPinToggled}
        tasks={tasks}
        overdueTasks={pastTasks}
        overdueCount={overdueCount}
        onRescheduleAll={handleRescheduleAllOverdue}
        onViewOverdue={handleViewOverdue}
        weekStartsOn={weekStartsOn}
      />

      {categoryContextMenu && (
        <CategoryContextMenu
          category={categoryContextMenu.category}
          x={categoryContextMenu.x}
          y={categoryContextMenu.y}
          onClose={() => setCategoryContextMenu(null)}
          onRenamed={handleCategoryRenamed}
          onDeleted={handleCategoryDeleted}
          onPinToggled={handleCategoryPinToggled}
        />
      )}

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
