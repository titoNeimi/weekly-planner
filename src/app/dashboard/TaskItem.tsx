"use client";

import type { SerializedTask } from "./WeekView";
import { COLOR_CLASSES } from "@/lib/category-colors";
import type { CategoryColor } from "@/lib/category-colors";

export default function TaskItem({
  task,
  onToggled,
  onDeleted,
}: {
  task: SerializedTask;
  onToggled: (id: string, done: boolean) => void;
  onDeleted: (id: string) => void;
}) {
  async function handleToggle() {
    const newDone = !task.done;
    onToggled(task.id, newDone);
    await fetch(`/api/task/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done: newDone }),
    });
  }

  async function handleDelete() {
    onDeleted(task.id);
    await fetch(`/api/task/${task.id}`, { method: "DELETE" });
  }

  const categoryBadgeClass = task.category
    ? (COLOR_CLASSES[task.category.color as CategoryColor] ??
      "bg-gray-100 text-gray-500")
    : null;

  return (
    <div
      className={`group rounded-lg border px-3 py-2 transition ${
        task.done
          ? "border-gray-100 bg-gray-50"
          : "border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm"
      }`}
    >
      <div className="flex items-start gap-2">
        <button
          onClick={handleToggle}
          aria-label={task.done ? "Mark incomplete" : "Mark complete"}
          className={`mt-0.5 h-4 w-4 shrink-0 rounded border transition ${
            task.done
              ? "border-gray-300 bg-gray-300"
              : "border-gray-300 bg-white hover:border-gray-500"
          }`}
        />
        <div className="min-w-0 flex-1">
          <p
            className={`text-sm font-medium leading-snug wrap-break-word ${
              task.done ? "line-through text-gray-300" : "text-gray-800"
            }`}
          >
            {task.title}
          </p>
          {task.notes && (
            <p
              className={`mt-1 text-xs leading-relaxed wrap-break-word ${
                task.done ? "text-gray-300" : "text-gray-400"
              }`}
            >
              {task.notes}
            </p>
          )}
          {task.category && categoryBadgeClass && (
            <span
              className={`mt-1.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${categoryBadgeClass}`}
            >
              {task.category.name}
            </span>
          )}
        </div>
        <button
          onClick={handleDelete}
          aria-label="Delete task"
          className="invisible shrink-0 text-gray-300 hover:text-red-400 group-hover:visible text-sm leading-none"
        >
          ×
        </button>
      </div>
    </div>
  );
}
