"use client";

import { useCallback, useEffect, useState } from "react";

import { CalendarDays, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import Avatar from "@/components/avatar";
import { useLanguage } from "@/context/LanguageContext";

import TeamTaskModal, { type TeamTaskData } from "./TeamTaskModal";
import TeamTaskDetailModal from "./TeamTaskDetailModal";
import type { TeamCategoryData } from "./TeamCategoriesSection";
import { SWATCH_CLASSES } from "@/lib/category-colors";
import type { CategoryColor } from "@/lib/category-colors";

type MemberRow = {
  id: string;
  userId: string;
  profile: { name: string | null; avatarUrl: string | null };
};

function groupByDate(
  tasks: TeamTaskData[],
  labelFn: (key: string) => string,
): { label: string; key: string; tasks: TeamTaskData[] }[] {
  const map = new Map<string, TeamTaskData[]>();
  for (const task of tasks) {
    if (task.date === null) continue;
    const key = task.date.slice(0, 10);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(task);
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, tasks]) => ({ label: labelFn(key), key, tasks }));
}

export default function TeamTasksSection({
  teamId,
  members,
  categories,
  myUserId,
  myRole,
  isGlobalAdmin,
}: {
  teamId: string;
  members: MemberRow[];
  categories: TeamCategoryData[];
  myUserId: string;
  myRole: "OWNER" | "ADMIN" | "USER" | null;
  isGlobalAdmin: boolean;
}) {
  const [tasks, setTasks] = useState<TeamTaskData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [detailTask, setDetailTask] = useState<TeamTaskData | null>(null);
  const [modalTask, setModalTask] = useState<TeamTaskData | "new" | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { t, lang } = useLanguage();

  const locale = lang === "es" ? "es-ES" : "en-US";

  function dateLabel(dateStr: string): string {
    const d = new Date(dateStr + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
    if (diff === 0) return t("overview_today");
    if (diff === 1) return t("overview_tomorrow");
    if (diff === -1) return lang === "es" ? "Ayer" : "Yesterday";
    if (diff < 0)
      return d.toLocaleDateString(locale, { month: "short", day: "numeric" }) + (lang === "es" ? " — atrasada" : " — overdue");
    return d.toLocaleDateString(locale, { weekday: "short", month: "short", day: "numeric" });
  }

  const memberMap = new Map(members.map((m) => [m.id, m]));
  const memberOptions = members.map((m) => ({
    id: m.id,
    name: m.profile.name,
  }));

  const canDelete = (task: TeamTaskData) =>
    isGlobalAdmin ||
    myRole === "OWNER" ||
    myRole === "ADMIN" ||
    task.createdByUserId === myUserId;

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/team/${teamId}/task`);
      if (!res.ok) throw new Error();
      setTasks(await res.json());
    } catch {
      toast.error("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const displayTasks =
    filter === "all"
      ? tasks
      : filter === "unassigned"
        ? tasks.filter((t) => !t.assignedToId)
        : tasks.filter((t) => t.assignedToId === filter);

  const undatedTasks = displayTasks.filter((t) => t.date === null);
  const datedTasks = displayTasks.filter((t) => t.date !== null);
  const groups = groupByDate(datedTasks, dateLabel);

  async function toggleDone(task: TeamTaskData) {
    const next = !task.done;
    setTogglingId(task.id);
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, done: next } : t)),
    );
    try {
      const res = await fetch(`/api/team/${teamId}/task/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ done: next }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, done: !next } : t)),
      );
      toast.error("Failed to update task");
    } finally {
      setTogglingId(null);
    }
  }

  async function deleteTask(task: TeamTaskData) {
    setDeletingId(task.id);
    setTasks((prev) => prev.filter((t) => t.id !== task.id));
    try {
      const res = await fetch(`/api/team/${teamId}/task/${task.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      toast.success(t("task_deleted"));
    } catch {
      setTasks((prev) => [...prev, task]);
      toast.error("Failed to delete task");
    } finally {
      setDeletingId(null);
    }
  }

  function handleSaved(saved: TeamTaskData) {
    setTasks((prev) => {
      const exists = prev.some((t) => t.id === saved.id);
      return exists
        ? prev.map((t) => (t.id === saved.id ? saved : t))
        : [...prev, saved];
    });
  }

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
          <h2 className="shrink-0 text-sm font-semibold text-gray-900">
            {t("team_tab_tasks")}{" "}
            <span className="font-normal text-gray-400">
              ({displayTasks.length})
            </span>
          </h2>
          <button
            onClick={() => setModalTask("new")}
            className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white transition hover:bg-primary-hover"
          >
            <Plus className="h-3.5 w-3.5" />
            {t("team_tasks_add")}
          </button>
        </div>

        {/* Assignee filter chips */}
        <div className="flex flex-wrap items-center gap-2 border-b border-gray-50 px-5 py-3">
          <button
            onClick={() => setFilter("all")}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              filter === "all"
                ? "bg-gray-900 text-white"
                : "border border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-800"
            }`}
          >
            {t("all")}
          </button>
          <button
            onClick={() => setFilter("unassigned")}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              filter === "unassigned"
                ? "bg-gray-900 text-white"
                : "border border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-800"
            }`}
          >
            {t("team_tasks_no_one")}
          </button>
          {members.map((m) => (
            <button
              key={m.id}
              onClick={() => setFilter(m.id)}
              title={m.profile.name ?? m.userId}
              className={`rounded-full transition ${
                filter === m.id
                  ? "ring-2 ring-primary ring-offset-1"
                  : "opacity-60 hover:opacity-100"
              }`}
            >
              <Avatar
                name={m.profile.name ?? undefined}
                avatarUrl={m.profile.avatarUrl ?? undefined}
              />
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : displayTasks.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <p className="text-sm text-gray-400">
              {filter === "all" ? t("team_tasks_empty") : t("team_tasks_empty_filter")}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {undatedTasks.length > 0 && (
              <div>
                <p className="px-5 pb-1 pt-3 text-xs font-medium text-gray-400">
                  {t("undated_section")}
                </p>
                <ul className="pb-2">
                  {undatedTasks.map((task) => {
                    const assignee = task.assignedToId
                      ? memberMap.get(task.assignedToId)
                      : null;
                    return (
                      <li
                        key={task.id}
                        onClick={() => setDetailTask(task)}
                        className={`group flex cursor-pointer items-center gap-3 px-5 py-2 transition ${
                          task.isEvent ? "hover:bg-amber-50" : "hover:bg-gray-50"
                        }`}
                      >
                        {task.isEvent ? (
                          <CalendarDays size={14} className="shrink-0 text-amber-500" aria-hidden="true" />
                        ) : (
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleDone(task); }}
                            disabled={togglingId === task.id}
                            aria-label={task.done ? t("task_mark_incomplete") : t("task_mark_complete")}
                            className={`h-4 w-4 shrink-0 cursor-pointer rounded border transition disabled:opacity-50 ${task.done ? "border-primary bg-primary" : "border-gray-200 bg-white hover:border-primary"}`}
                          />
                        )}
                        <p className={`min-w-0 flex-1 truncate text-sm font-medium ${task.done && !task.isEvent ? "text-gray-300 line-through" : task.isEvent ? "text-amber-900" : "text-gray-800"}`}>
                          {task.title}
                        </p>
                        <div className="invisible flex shrink-0 items-center gap-1 group-hover:visible">
                          <button onClick={(e) => { e.stopPropagation(); setModalTask(task); }} aria-label={t("task_edit")} className="cursor-pointer text-gray-300 transition hover:text-gray-500">
                            <Pencil size={13} />
                          </button>
                          {canDelete(task) && (
                            <button onClick={(e) => { e.stopPropagation(); deleteTask(task); }} disabled={deletingId === task.id} aria-label={t("task_delete")} className="cursor-pointer text-gray-300 transition hover:text-red-400 disabled:opacity-40">
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
            {groups.map(({ label, key, tasks: groupTasks }) => (
              <div key={key}>
                <p className="px-5 pb-1 pt-3 text-xs font-medium text-gray-400">
                  {label}
                </p>
                <ul className="pb-2">
                  {groupTasks.map((task) => {
                    const assignee = task.assignedToId
                      ? memberMap.get(task.assignedToId)
                      : null;
                    return (
                      <li
                        key={task.id}
                        onClick={() => setDetailTask(task)}
                        className={`group flex cursor-pointer items-center gap-3 px-5 py-2 transition ${
                          task.isEvent ? "hover:bg-amber-50" : "hover:bg-gray-50"
                        }`}
                      >
                        {task.isEvent ? (
                          <CalendarDays
                            size={14}
                            className="shrink-0 text-amber-500"
                            aria-hidden="true"
                          />
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleDone(task);
                            }}
                            disabled={togglingId === task.id}
                            aria-label={task.done ? t("task_mark_incomplete") : t("task_mark_complete")}
                            className={`h-4 w-4 shrink-0 cursor-pointer rounded border transition disabled:opacity-50 ${
                              task.done
                                ? "border-primary bg-primary"
                                : "border-gray-200 bg-white hover:border-primary"
                            }`}
                          />
                        )}
                        <p
                          className={`min-w-0 flex-1 truncate text-sm font-medium ${
                            task.done && !task.isEvent
                              ? "text-gray-300 line-through"
                              : task.isEvent
                                ? "text-amber-900"
                                : "text-gray-800"
                          }`}
                        >
                          {task.title}
                        </p>
                        {task.teamCategoryId && (() => {
                          const cat = categories.find((c) => c.id === task.teamCategoryId);
                          return cat ? (
                            <span
                              title={cat.name}
                              className={`h-2 w-2 shrink-0 rounded-full ${SWATCH_CLASSES[cat.color as CategoryColor] ?? "bg-gray-300"}`}
                            />
                          ) : null;
                        })()}
                        {task.notes && (
                          <span className="hidden shrink-0 rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-400 sm:inline">
                            note
                          </span>
                        )}
                        {assignee && (
                          <div
                            title={assignee.profile.name ?? undefined}
                            className="shrink-0"
                          >
                            <Avatar
                              name={assignee.profile.name ?? undefined}
                              avatarUrl={
                                assignee.profile.avatarUrl ?? undefined
                              }
                            />
                          </div>
                        )}
                        <div className="invisible flex shrink-0 items-center gap-1 group-hover:visible">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setModalTask(task);
                            }}
                            aria-label={t("task_edit")}
                            className="cursor-pointer text-gray-300 transition hover:text-gray-500"
                          >
                            <Pencil size={13} />
                          </button>
                          {canDelete(task) && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteTask(task);
                              }}
                              disabled={deletingId === task.id}
                              aria-label={t("task_delete")}
                              className="cursor-pointer text-gray-300 transition hover:text-red-400 disabled:opacity-40"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>

      {detailTask !== null && (
        <TeamTaskDetailModal
          task={detailTask}
          teamId={teamId}
          assignee={
            detailTask.assignedToId
              ? (memberMap.get(detailTask.assignedToId)?.profile ?? null)
              : null
          }
          onClose={() => setDetailTask(null)}
          onEdit={() => {
            setModalTask(detailTask);
            setDetailTask(null);
          }}
          onToggle={() => {
            toggleDone(detailTask);
            setDetailTask((t) => (t ? { ...t, done: !t.done } : null));
          }}
          onSaved={(saved) => {
            handleSaved(saved);
            setDetailTask(saved);
          }}
        />
      )}

      {modalTask !== null && (
        <TeamTaskModal
          teamId={teamId}
          members={memberOptions}
          categories={categories}
          task={modalTask === "new" ? undefined : modalTask}
          onClose={() => setModalTask(null)}
          onSaved={handleSaved}
        />
      )}
    </>
  );
}
