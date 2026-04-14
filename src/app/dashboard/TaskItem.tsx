"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import type { SerializedTask, SerializedCategory } from "./WeekView";
import { COLOR_CLASSES } from "@/lib/category-colors";
import type { CategoryColor } from "@/lib/category-colors";
import EditTaskModal from "./EditTaskModal";
import TaskDetailModal from "./TaskDetailModal";
import { toast } from "sonner";

export default function TaskItem({
  task,
  categories,
  onToggled,
  onUpdated,
  onDeleted,
}: {
  task: SerializedTask;
  categories: SerializedCategory[];
  onToggled: (id: string, done: boolean) => void;
  onUpdated: (task: SerializedTask) => void;
  onDeleted: (id: string) => void;
}) {
  const [detailOpen, setDetailOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

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
    toast.success("Task deleted");
  }

  const categoryBadgeClass = task.category
    ? (COLOR_CLASSES[task.category.color as CategoryColor] ??
      "bg-gray-100 text-gray-500")
    : null;

  return (
    <div
      onClick={() => setDetailOpen(true)}
      className={`group cursor-pointer rounded-lg border px-3 py-2 transition ${
        task.done
          ? "border-gray-100 bg-gray-50"
          : "border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm"
      }`}
    >
      <div className="flex items-start gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleToggle();
          }}
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
        <div className="invisible flex shrink-0 items-center gap-1 group-hover:visible">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setEditOpen(true);
            }}
            aria-label="Edit task"
            className="text-gray-300 hover:text-gray-500 transition"
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete();
            }}
            aria-label="Delete task"
            className="text-gray-300 hover:text-red-400 transition"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {detailOpen && (
        <TaskDetailModal
          task={task}
          onClose={() => setDetailOpen(false)}
          onEdit={() => {
            setDetailOpen(false);
            setEditOpen(true);
          }}
        />
      )}

      {editOpen && (
        <EditTaskModal
          task={task}
          categories={categories}
          onClose={() => setEditOpen(false)}
          onSaved={onUpdated}
        />
      )}
    </div>
  );
}
