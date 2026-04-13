"use client";

import { useState } from "react";
import type { SerializedTask, SerializedCategory } from "./WeekView";
import TaskItem from "./TaskItem";
import AddTaskModal from "./AddTaskModal";

export default function DayColumn({
  label,
  date,
  tasks,
  categories,
  onTaskCreated,
  onTaskToggled,
  onTaskUpdated,
  onTaskDeleted,
  onCategoryCreated,
}: {
  label: string;
  date: Date;
  tasks: SerializedTask[];
  categories: SerializedCategory[];
  onTaskCreated: (task: SerializedTask) => void;
  onTaskToggled: (id: string, done: boolean) => void;
  onTaskUpdated: (task: SerializedTask) => void;
  onTaskDeleted: (id: string) => void;
  onCategoryCreated: (category: SerializedCategory) => void;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const isToday =
    date.toISOString().slice(0, 10) === new Date().toISOString().slice(0, 10);

  return (
    <>
      <div
        className={`flex h-full flex-col gap-3 rounded-xl border p-3 sm:p-4 ${
          isToday
            ? "border-gray-900 bg-white shadow-sm"
            : "border-gray-200 bg-white"
        }`}
      >
        <div className="flex items-center justify-between">
          <span
            className={`text-xs font-semibold uppercase tracking-widest ${
              isToday ? "text-gray-900" : "text-gray-400"
            }`}
          >
            {label}
          </span>
          <span
            className={
              isToday
                ? "flex h-6 w-6 items-center justify-center rounded-full bg-gray-900 text-xs font-semibold text-white"
                : "text-sm tabular-nums text-gray-300"
            }
          >
            {date.getUTCDate()}
          </span>
        </div>

        <div className="flex flex-1 flex-col gap-2">
          {tasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              categories={categories}
              onToggled={onTaskToggled}
              onUpdated={onTaskUpdated}
              onDeleted={onTaskDeleted}
            />
          ))}
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="w-full rounded-lg py-1.5 text-xs text-gray-300 hover:bg-gray-50 hover:text-gray-500 transition text-left pl-1"
        >
          + add task
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
