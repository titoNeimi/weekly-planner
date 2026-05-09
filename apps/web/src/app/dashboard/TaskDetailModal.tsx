"use client";

import { useEffect } from "react";
import { Pencil, Check } from "lucide-react";
import type { SerializedTask } from "./WeekView";
import { COLOR_CLASSES } from "@/lib/category-colors";
import type { CategoryColor } from "@/lib/category-colors";

export default function TaskDetailModal({
  task,
  onClose,
  onEdit,
  onToggle,
}: {
  task: SerializedTask;
  onClose: () => void;
  onEdit: () => void;
  onToggle: () => void;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function handleBackdrop(e: React.MouseEvent) {
    e.stopPropagation();
    if (e.target === e.currentTarget) onClose();
  }

  const categoryBadgeClass = task.category
    ? (COLOR_CLASSES[task.category.color as CategoryColor] ??
      "bg-gray-100 text-gray-500")
    : null;

  const timeUTC = task.date.slice(11, 16); // "HH:MM"
  const hasTime = timeUTC !== "00:00";

  const dateLabel = new Date(task.date).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={handleBackdrop}
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-2">
            <div
              className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${
                task.done ? "bg-gray-300" : "bg-gray-800"
              }`}
            />
            <h2
              className={`wrap-break-word text-base font-semibold leading-snug ${
                task.done ? "line-through text-gray-400" : "text-gray-900"
              }`}
            >
              {task.title}
            </h2>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              onClick={onToggle}
              className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs transition ${
                task.done
                  ? "border-gray-200 text-gray-400 hover:bg-gray-50"
                  : "border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
              }`}
            >
              <Check size={11} />
              {task.done ? "Undo" : "Done"}
            </button>
            <button
              onClick={onEdit}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs text-gray-600 hover:bg-gray-50 transition"
            >
              <Pencil size={11} />
              Edit
            </button>
            <button
              onClick={onClose}
              className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
            <span>{dateLabel}</span>
            {hasTime && (
              <span className="rounded-full bg-gray-100 px-2 py-0.5 font-medium text-gray-700">
                {timeUTC}
              </span>
            )}
          </div>

          {task.category && categoryBadgeClass && (
            <span
              className={`inline-flex w-fit items-center rounded-full px-2.5 py-1 text-xs font-medium ${categoryBadgeClass}`}
            >
              {task.category.name}
            </span>
          )}

          {task.notes ? (
            <div className="rounded-lg bg-gray-50 px-3 py-2.5">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
                {task.notes}
              </p>
            </div>
          ) : (
            <p className="text-xs italic text-gray-400">No notes</p>
          )}
        </div>
      </div>
    </div>
  );
}
