"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import type { SerializedTask, SerializedCategory } from "./WeekView";
import { COLOR_CLASSES } from "@/lib/category-colors";
import type { CategoryColor } from "@/lib/category-colors";
import { VIRTUAL_ID_PREFIX } from "@/lib/recurring-tasks";
import { RefreshCcw } from "lucide-react";
import EditTaskModal from "./EditTaskModal";
import EditSeriesModal from "./EditSeriesModal";
import TaskDetailModal from "./TaskDetailModal";
import RecurringActionDialog from "./RecurringActionDialog";
import { toast } from "sonner";

export default function TaskItem({
  task,
  categories,
  onToggled,
  onUpdated,
  onDeleted,
  onReplaced,
  onSeriesDeleted,
  onSeriesUpdated,
}: {
  task: SerializedTask;
  categories: SerializedCategory[];
  onToggled: (id: string, done: boolean) => void;
  onUpdated: (task: SerializedTask) => void;
  onDeleted: (id: string) => void;
  onReplaced: (oldId: string, task: SerializedTask) => void;
  onSeriesDeleted: (recurringTaskId: string) => void;
  onSeriesUpdated: (
    recurringTaskId: string,
    changes: Pick<
      SerializedTask,
      "title" | "categoryId" | "notes" | "category"
    >,
  ) => void;
}) {
  const [detailOpen, setDetailOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editSeriesOpen, setEditSeriesOpen] = useState(false);
  const [recurringDialog, setRecurringDialog] = useState<
    "edit" | "delete" | null
  >(null);

  const isVirtual = task.id.startsWith(VIRTUAL_ID_PREFIX);

  async function handleToggle() {
    const newDone = !task.done;
    if (isVirtual) {
      // Can't be optimistic — the backend assigns a new real ID on materialization.
      const res = await fetch(`/api/task/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ done: newDone }),
      });
      const realTask: SerializedTask = await res.json();
      onReplaced(task.id, realTask);
      return;
    }
    onToggled(task.id, newDone);
    await fetch(`/api/task/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done: newDone }),
    });
  }

  function handleEditClick() {
    setDetailOpen(false);
    if (isVirtual) {
      setRecurringDialog("edit");
      return;
    }
    setEditOpen(true);
  }

  function handleDeleteClick(e: React.MouseEvent) {
    e.stopPropagation();
    if (isVirtual) {
      setRecurringDialog("delete");
      return;
    }
    handleDeleteConfirmed();
  }

  async function handleDeleteConfirmed() {
    onDeleted(task.id);
    await fetch(`/api/task/${task.id}`, { method: "DELETE" });
    toast.success("Task deleted");
  }

  async function handleDeleteThisOne() {
    setRecurringDialog(null);
    onDeleted(task.id);
    await fetch(`/api/task/${task.id}`, { method: "DELETE" });
    toast.success("Occurrence deleted");
  }

  async function handleDeleteAll() {
    setRecurringDialog(null);
    if (!task.recurringTaskId) return;
    onSeriesDeleted(task.recurringTaskId);
    await fetch(`/api/recurring-task/${task.recurringTaskId}`, {
      method: "DELETE",
    });
    toast.success("Recurring task cancelled");
  }

  function handleEditSaved(updatedTask: SerializedTask) {
    if (task.id !== updatedTask.id) {
      // Virtual task was materialized — swap the virtual ID for the real one.
      onReplaced(task.id, updatedTask);
    } else {
      onUpdated(updatedTask);
    }
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
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {task.category && categoryBadgeClass && (
              <span
                className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${categoryBadgeClass}`}
              >
                {task.category.name}
              </span>
            )}
            {task.recurringTaskId && (
              <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">
                <RefreshCcw size={8} />
                Recurring
              </span>
            )}
          </div>
        </div>
        <div className="invisible flex shrink-0 items-center gap-1 group-hover:visible">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleEditClick();
            }}
            aria-label="Edit task"
            className="text-gray-300 hover:text-gray-500 transition"
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={handleDeleteClick}
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
          onEdit={handleEditClick}
          onToggle={handleToggle}
        />
      )}

      {recurringDialog && (
        <RecurringActionDialog
          action={recurringDialog}
          onThisOne={
            recurringDialog === "edit"
              ? () => {
                  setRecurringDialog(null);
                  setEditOpen(true);
                }
              : handleDeleteThisOne
          }
          onAll={
            recurringDialog === "edit"
              ? () => {
                  setRecurringDialog(null);
                  setEditSeriesOpen(true);
                }
              : handleDeleteAll
          }
          onClose={() => setRecurringDialog(null)}
        />
      )}

      {editOpen && (
        <EditTaskModal
          task={task}
          categories={categories}
          onClose={() => setEditOpen(false)}
          onSaved={handleEditSaved}
        />
      )}

      {editSeriesOpen && (
        <EditSeriesModal
          task={task}
          categories={categories}
          onClose={() => setEditSeriesOpen(false)}
          onSaved={(recurringTaskId, changes) => {
            onSeriesUpdated(recurringTaskId, changes);
          }}
        />
      )}
    </div>
  );
}
