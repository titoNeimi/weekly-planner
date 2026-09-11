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
import { getLocalTodayStr } from "@/lib/date";
import { useLanguage } from "@/context/LanguageContext";
import { useDensity } from "@/context/DensityContext";

export default function DayColumn({
  label,
  date,
  tasks,
  teamTasks,
  categories,
  onTaskCreated,
  onTaskToggled,
  onTaskUpdated,
  onTaskDeleted,
  onTaskReplaced,
  onSeriesDeleted,
  onSeriesUpdated,
  onCategoryCreated,
  onTaskDropped,
}: {
  label: string;
  date: Date;
  tasks: SerializedTask[];
  teamTasks: SerializedTeamTask[];
  categories: SerializedCategory[];
  onTaskCreated: (task: SerializedTask) => void;
  onTaskToggled: (id: string, done: boolean) => void;
  onTaskUpdated: (task: SerializedTask) => void;
  onTaskDeleted: (id: string) => void;
  onTaskReplaced: (oldId: string, task: SerializedTask) => void;
  onSeriesDeleted: (recurringTaskId: string) => void;
  onSeriesUpdated: (
    recurringTaskId: string,
    changes: Pick<
      SerializedTask,
      "title" | "categoryId" | "notes" | "category"
    >,
  ) => void;
  onCategoryCreated: (category: SerializedCategory) => void;
  onTaskDropped?: (taskId: string, dateStr: string) => void;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const { t } = useLanguage();
  const { density } = useDensity();
  const dateStr = date.toISOString().slice(0, 10);
  const isToday = dateStr === getLocalTodayStr();

  return (
    <>
      <div
        onDragOver={(e) => {
          if (!onTaskDropped) return;
          e.preventDefault();
          e.dataTransfer.dropEffect = "move";
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          if (!onTaskDropped) return;
          e.preventDefault();
          setDragOver(false);
          const taskId = e.dataTransfer.getData("text/plain");
          if (taskId) onTaskDropped(taskId, dateStr);
        }}
        className={`flex h-full flex-col rounded-xl border p-3 transition sm:p-4 ${
          dragOver
            ? "border-primary bg-primary-light/50"
            : isToday
              ? "border-primary bg-white dark:bg-gray-900 shadow-sm"
              : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
        }`}
      >
        <div className="mb-3 flex items-center justify-between">
          <span
            className={`text-[10px] font-semibold uppercase tracking-widest ${
              isToday ? "text-gray-900 dark:text-gray-100" : "text-gray-400 dark:text-gray-500"
            }`}
          >
            {label}
          </span>
          <span
            className={
              isToday
                ? "flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white"
                : "text-sm tabular-nums text-gray-300 dark:text-gray-600"
            }
          >
            {date.getUTCDate()}
          </span>
        </div>

        <div className={`flex flex-1 flex-col ${density === "compact" ? "gap-1" : "gap-2.5"}`}>
          {tasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              categories={categories}
              onToggled={onTaskToggled}
              onUpdated={onTaskUpdated}
              onDeleted={onTaskDeleted}
              onReplaced={onTaskReplaced}
              onCreated={onTaskCreated}
              onSeriesDeleted={onSeriesDeleted}
              onSeriesUpdated={onSeriesUpdated}
            />
          ))}
          {teamTasks.map((task) => (
            <TeamTaskItem key={task.id} task={task} />
          ))}
          {tasks.length === 0 && teamTasks.length === 0 && (
            <p className="py-3 text-center text-xs text-gray-300 dark:text-gray-600">
              {isToday ? t("day_nothing_planned_today") : t("day_nothing_planned")}
            </p>
          )}
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="mt-3 w-full rounded-lg border border-dashed border-gray-200 dark:border-gray-700 py-2 text-center text-xs text-gray-400 dark:text-gray-500 hover:border-gray-300 hover:text-gray-600 dark:hover:text-gray-300 transition"
        >
          {t("day_add_task")}
        </button>
      </div>

      {modalOpen && (
        <AddTaskModal
          defaultDate={date}
          onClose={() => setModalOpen(false)}
          onSaved={onTaskCreated}
          categories={categories}
          onCategoryCreated={onCategoryCreated}
        />
      )}
    </>
  );
}
