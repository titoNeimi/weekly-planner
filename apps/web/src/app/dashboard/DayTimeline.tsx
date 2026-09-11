"use client";

import { useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";
import type {
  SerializedTask,
  SerializedCategory,
  SerializedTeamTask,
} from "./WeekView";
import TaskItem from "./TaskItem";
import TeamTaskItem from "./TeamTaskItem";
import AddTaskModal from "./AddTaskModal";
import { useLanguage } from "@/context/LanguageContext";

const HOURS = Array.from({ length: 24 }, (_, i) => i);

function hourLabel(hour: number): string {
  return `${String(hour).padStart(2, "0")}:00`;
}

export default function DayTimeline({
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
  onTaskDropped: (taskId: string, time: string) => void;
}) {
  const { t } = useLanguage();
  const [dragOverHour, setDragOverHour] = useState<number | "allday" | null>(
    null,
  );
  const [addAt, setAddAt] = useState<{ date: Date; time?: string } | null>(
    null,
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const dateStr = date.toISOString().slice(0, 10);

  useEffect(() => {
    const el = containerRef.current?.querySelector('[data-hour="7"]');
    el?.scrollIntoView({ block: "start" });
  }, [dateStr]);

  const allDayTasks = tasks.filter((tk) => tk.allDay);
  // TeamTask has no `allDay` flag to disambiguate from an explicit midnight,
  // so it keeps the time-based heuristic.
  const allDayTeamTasks = teamTasks.filter(
    (tk) => tk.date?.slice(11, 16) === "00:00",
  );

  const tasksByHour = new Map<number, SerializedTask[]>();
  for (const task of tasks) {
    if (!task.date || task.allDay) continue;
    const h = Number(task.date.slice(11, 13));
    if (!tasksByHour.has(h)) tasksByHour.set(h, []);
    tasksByHour.get(h)!.push(task);
  }
  const teamTasksByHour = new Map<number, SerializedTeamTask[]>();
  for (const task of teamTasks) {
    if (!task.date || task.date.slice(11, 16) === "00:00") continue;
    const h = Number(task.date.slice(11, 13));
    if (!teamTasksByHour.has(h)) teamTasksByHour.set(h, []);
    teamTasksByHour.get(h)!.push(task);
  }

  const taskItemProps = {
    categories,
    onToggled: onTaskToggled,
    onUpdated: onTaskUpdated,
    onDeleted: onTaskDeleted,
    onReplaced: onTaskReplaced,
    onCreated: onTaskCreated,
    onSeriesDeleted: onSeriesDeleted,
    onSeriesUpdated: onSeriesUpdated,
  };

  function handleDrop(e: React.DragEvent, time: string) {
    e.preventDefault();
    setDragOverHour(null);
    const taskId = e.dataTransfer.getData("text/plain");
    if (taskId) onTaskDropped(taskId, time);
  }

  return (
    <div className="flex flex-col rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
      <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 px-3 py-2 sm:px-4">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
          {t("timeline_title")}
        </span>
        <button
          onClick={() => setAddAt({ date })}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-primary hover:bg-primary-light transition"
        >
          <Plus size={12} />
          {t("day_add_task")}
        </button>
      </div>

      {(allDayTasks.length > 0 || allDayTeamTasks.length > 0) && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
            setDragOverHour("allday");
          }}
          onDragLeave={() =>
            setDragOverHour((h) => (h === "allday" ? null : h))
          }
          onDrop={(e) => handleDrop(e, "00:00")}
          className={`flex gap-3 border-b border-gray-100 dark:border-gray-800 px-3 py-2.5 transition sm:px-4 ${
            dragOverHour === "allday" ? "bg-primary-light" : ""
          }`}
        >
          <span className="w-12 shrink-0 pt-1 text-[10px] font-medium uppercase text-gray-400 dark:text-gray-500">
            {t("timeline_all_day")}
          </span>
          <div className="flex flex-1 flex-col gap-2">
            {allDayTasks.map((task) => (
              <TaskItem key={task.id} task={task} {...taskItemProps} />
            ))}
            {allDayTeamTasks.map((task) => (
              <TeamTaskItem key={task.id} task={task} />
            ))}
          </div>
        </div>
      )}

      <div ref={containerRef} className="max-h-[560px] overflow-y-auto">
        {HOURS.map((hour) => {
          const hourTasks = tasksByHour.get(hour) ?? [];
          const hourTeamTasks = teamTasksByHour.get(hour) ?? [];
          const hasItems = hourTasks.length + hourTeamTasks.length > 0;

          return (
            <div
              key={hour}
              data-hour={hour}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                setDragOverHour(hour);
              }}
              onDragLeave={() =>
                setDragOverHour((h) => (h === hour ? null : h))
              }
              onDrop={(e) => handleDrop(e, hourLabel(hour))}
              className={`group flex gap-3 border-b border-gray-50 dark:border-gray-900 px-3 py-2 transition last:border-0 sm:px-4 ${
                dragOverHour === hour ? "bg-primary-light" : ""
              }`}
            >
              <span className="w-12 shrink-0 pt-0.5 text-[10px] tabular-nums text-gray-300 dark:text-gray-600">
                {hourLabel(hour)}
              </span>
              <div className="flex min-h-[1.75rem] flex-1 flex-col gap-2 py-0.5">
                {hourTasks.map((task) => (
                  <TaskItem key={task.id} task={task} {...taskItemProps} />
                ))}
                {hourTeamTasks.map((task) => (
                  <TeamTaskItem key={task.id} task={task} />
                ))}
                {!hasItems && (
                  <button
                    onClick={() =>
                      setAddAt({ date, time: hourLabel(hour) })
                    }
                    className="hidden h-5 w-full rounded text-left text-[11px] text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 group-hover:block"
                  >
                    {t("day_add_task")}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {addAt && (
        <AddTaskModal
          defaultDate={addAt.date}
          defaultTime={addAt.time}
          onClose={() => setAddAt(null)}
          onSaved={(task) => {
            onTaskCreated(task);
            setAddAt(null);
          }}
          categories={categories}
          onCategoryCreated={onCategoryCreated}
        />
      )}
    </div>
  );
}
