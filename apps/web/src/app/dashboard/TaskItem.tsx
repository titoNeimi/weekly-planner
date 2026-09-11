"use client";

import { useState } from "react";
import { Pencil, Trash2, CalendarDays, Clock } from "lucide-react";
import type { SerializedTask, SerializedCategory } from "./WeekView";
import { COLOR_CLASSES } from "@/lib/category-colors";
import type { CategoryColor } from "@/lib/category-colors";
import { VIRTUAL_ID_PREFIX } from "@/lib/recurring-tasks";
import { stripMarkdown } from "@/lib/strip-markdown";
import { getLocalTodayStr } from "@/lib/date";
import { RefreshCcw } from "lucide-react";
import EditTaskModal from "./EditTaskModal";
import EditSeriesModal from "./EditSeriesModal";
import TaskDetailModal from "./TaskDetailModal";
import RecurringActionDialog from "./RecurringActionDialog";
import TaskContextMenu from "./TaskContextMenu";
import { toast } from "sonner";
import { useLanguage } from "@/context/LanguageContext";
import { useDensity } from "@/context/DensityContext";
import { undoableAction } from "@/lib/undo-toast";

export default function TaskItem({
  task,
  categories,
  onToggled,
  onUpdated,
  onDeleted,
  onReplaced,
  onCreated,
  onSeriesDeleted,
  onSeriesUpdated,
}: {
  task: SerializedTask;
  categories: SerializedCategory[];
  onToggled: (id: string, done: boolean) => void;
  onUpdated: (task: SerializedTask) => void;
  onDeleted: (id: string) => void;
  onReplaced: (oldId: string, task: SerializedTask) => void;
  onCreated: (task: SerializedTask) => void;
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
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const { t, tpl } = useLanguage();
  const { density } = useDensity();
  const compact = density === "compact";

  const isVirtual = task.id.startsWith(VIRTUAL_ID_PREFIX);

  const overdueDays =
    !task.done && !task.isEvent && task.date && task.date.slice(0, 10) < getLocalTodayStr()
      ? Math.round(
          (new Date(`${getLocalTodayStr()}T00:00:00Z`).getTime() -
            new Date(`${task.date.slice(0, 10)}T00:00:00Z`).getTime()) /
            86_400_000,
        )
      : 0;

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

  function triggerDelete() {
    if (isVirtual) {
      setRecurringDialog("delete");
      return;
    }
    handleDeleteConfirmed();
  }

  function handleDeleteClick(e: React.MouseEvent) {
    e.stopPropagation();
    triggerDelete();
  }

  function handleDeleteConfirmed() {
    onDeleted(task.id);
    undoableAction({
      message: t("task_deleted"),
      undoLabel: t("toast_undo"),
      commit: () => fetch(`/api/task/${task.id}`, { method: "DELETE" }),
      rollback: () => onCreated(task),
    });
  }

  function handleDeleteThisOne() {
    setRecurringDialog(null);
    onDeleted(task.id);
    undoableAction({
      message: t("task_occurrence_deleted"),
      undoLabel: t("toast_undo"),
      commit: () => fetch(`/api/task/${task.id}`, { method: "DELETE" }),
      rollback: () => onCreated(task),
    });
  }

  async function handleDeleteAll() {
    setRecurringDialog(null);
    if (!task.recurringTaskId) return;
    onSeriesDeleted(task.recurringTaskId);
    await fetch(`/api/recurring-task/${task.recurringTaskId}`, {
      method: "DELETE",
    });
    toast.success(t("task_series_cancelled"));
  }

  async function handleReschedule(dateStr: string) {
    const timeStr = task.date ? task.date.slice(11, 16) : null;
    const res = await fetch(`/api/task/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: dateStr, time: timeStr }),
    });
    if (!res.ok) {
      toast.error(t("task_reschedule_error"));
      return;
    }
    const updated: SerializedTask = await res.json();
    if (task.id !== updated.id) {
      onReplaced(task.id, updated);
    } else {
      onUpdated(updated);
    }
    toast.success(t("task_rescheduled"));
  }

  async function handleDuplicate() {
    if (!task.date) return;
    const dateStr = task.date.slice(0, 10);
    const timeStr = task.date.slice(11, 16);
    const res = await fetch("/api/task", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: task.title,
        categoryId: task.categoryId,
        notes: task.notes,
        date: dateStr,
        time: timeStr,
      }),
    });
    const newTask: SerializedTask = await res.json();
    onCreated(newTask);
    toast.success(t("task_duplicated"));
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
      "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400")
    : null;

  return (
    <div
      onClick={() => setDetailOpen(true)}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenu({ x: e.clientX, y: e.clientY });
      }}
      draggable={task.date !== null}
      onDragStart={(e) => {
        if (!task.date) return;
        e.dataTransfer.setData("text/plain", task.id);
        e.dataTransfer.effectAllowed = "move";
      }}
      className={`group cursor-pointer rounded-lg border transition ${
        compact ? "px-2.5 py-1.5" : "px-3 py-2.5"
      } ${task.date ? "active:cursor-grabbing" : ""} ${
        task.isEvent
          ? "border-amber-200 bg-amber-50 hover:border-amber-300 hover:shadow-sm"
          : task.done
            ? "border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-950"
            : "border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-gray-200 hover:shadow-sm"
      }`}
    >
      <div className="flex items-start gap-2">
        {task.isEvent ? (
          <CalendarDays
            size={14}
            className="mt-0.5 shrink-0 text-amber-500"
            aria-hidden="true"
          />
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleToggle();
            }}
            aria-label={task.done ? t("task_mark_incomplete") : t("task_mark_complete")}
            className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition ${
              task.done
                ? "border-primary bg-primary"
                : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-primary"
            }`}
          >
            {task.done && (
              <svg width="8" height="6" viewBox="0 0 8 6" fill="none" aria-hidden="true">
                <path d="M1 3l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
        )}
        <div className="min-w-0 flex-1">
          <p
            className={`text-sm font-medium leading-snug wrap-break-word ${
              task.done && !task.isEvent ? "line-through text-gray-300 dark:text-gray-600" : "text-gray-800 dark:text-gray-200"
            }`}
          >
            {task.title}
          </p>
          {task.notes && !compact && (
            <p
              className={`mt-1 line-clamp-2 text-xs leading-relaxed ${
                task.done && !task.isEvent ? "text-gray-300 dark:text-gray-600" : "text-gray-400 dark:text-gray-500"
              }`}
            >
              {stripMarkdown(task.notes)}
            </p>
          )}
          <div className={`flex flex-wrap gap-1.5 ${compact ? "mt-1" : "mt-1.5"}`}>
            {overdueDays > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                <Clock size={8} />
                {tpl("task_overdue_badge", { n: overdueDays })}
              </span>
            )}
            {task.isEvent && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                <CalendarDays size={8} />
                {t("task_event")}
              </span>
            )}
            {task.category && categoryBadgeClass && (
              <span
                className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${categoryBadgeClass}`}
              >
                {task.category.name}
              </span>
            )}
            {task.recurringTaskId && (
              <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-[10px] font-medium text-gray-500 dark:text-gray-400">
                <RefreshCcw size={8} />
                {t("task_recurring")}
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
            aria-label={t("task_edit")}
            className="text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 transition"
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={handleDeleteClick}
            aria-label={t("task_delete")}
            className="text-gray-300 dark:text-gray-600 hover:text-red-400 transition"
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
          onSaved={onUpdated}
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

      {contextMenu && (
        <TaskContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onDuplicate={handleDuplicate}
          onReschedule={handleReschedule}
          onDelete={triggerDelete}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
}
