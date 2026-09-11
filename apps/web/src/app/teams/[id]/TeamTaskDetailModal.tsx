"use client";

import { useEffect, useState } from "react";
import { Check, Pencil } from "lucide-react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github.css";
import { toast } from "sonner";
import Avatar from "@/components/avatar";
import type { TeamTaskData } from "./TeamTaskModal";
import { useLanguage } from "@/context/LanguageContext";

type Assignee = { name: string | null; avatarUrl: string | null };

function toggleNthCheckbox(text: string, targetIndex: number): string {
  let count = 0;
  return text.replace(/- \[([ xX])\]/g, (match, state) => {
    if (count++ === targetIndex) {
      return state === " " ? "- [x]" : "- [ ]";
    }
    return match;
  });
}

export default function TeamTaskDetailModal({
  task,
  teamId,
  assignee,
  onClose,
  onEdit,
  onToggle,
  onSaved,
}: {
  task: TeamTaskData;
  teamId: string;
  assignee: Assignee | null;
  onClose: () => void;
  onEdit: () => void;
  onToggle: () => void;
  onSaved: (task: TeamTaskData) => void;
}) {
  const [notes, setNotes] = useState(task.notes ?? "");
  const { t } = useLanguage();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const dateLabel = task.date
    ? new Date(task.date.slice(0, 10) + "T00:00:00").toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  async function handleCheckboxToggle(index: number) {
    const updated = toggleNthCheckbox(notes, index);
    setNotes(updated);
    try {
      const res = await fetch(`/api/team/${teamId}/task/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: updated }),
      });
      if (!res.ok) throw new Error();
      onSaved({ ...task, notes: updated });
    } catch {
      setNotes(notes);
      toast.error("Failed to save");
    }
  }

  const components: Components = {
    h1: ({ children }) => (
      <h1 className="mb-3 mt-6 text-lg font-bold text-gray-900 dark:text-gray-100 first:mt-0">
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 className="mb-2 mt-5 text-base font-semibold text-gray-900 dark:text-gray-100 first:mt-0">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="mb-2 mt-4 text-sm font-semibold text-gray-800 dark:text-gray-200 first:mt-0">
        {children}
      </h3>
    ),
    p: ({ children }) => (
      <p className="mb-3 text-sm leading-relaxed text-gray-700 dark:text-gray-300 last:mb-0">
        {children}
      </p>
    ),
    ul: ({ children }) => (
      <ul className="mb-3 list-disc space-y-1 pl-5 text-sm text-gray-700 dark:text-gray-300 last:mb-0">
        {children}
      </ul>
    ),
    ol: ({ children }) => (
      <ol className="mb-3 list-decimal space-y-1 pl-5 text-sm text-gray-700 dark:text-gray-300 last:mb-0">
        {children}
      </ol>
    ),
    li: ({ children }) => <li className="leading-relaxed">{children}</li>,
    strong: ({ children }) => (
      <strong className="font-semibold text-gray-900 dark:text-gray-100">{children}</strong>
    ),
    em: ({ children }) => <em className="italic text-gray-700 dark:text-gray-300">{children}</em>,
    blockquote: ({ children }) => (
      <blockquote className="mb-3 border-l-4 border-gray-300 dark:border-gray-600 pl-3 italic text-gray-500 dark:text-gray-400">
        {children}
      </blockquote>
    ),
    code: ({ className, children }) => {
      if (className) {
        return <code className={className}>{children}</code>;
      }
      return (
        <code className="rounded bg-gray-200 dark:bg-gray-700 px-1 py-0.5 font-mono text-xs text-gray-800 dark:text-gray-200">
          {children}
        </code>
      );
    },
    pre: ({ children }) => (
      <pre className="mb-3 overflow-x-auto rounded-lg bg-gray-900 p-3 text-xs text-gray-100 last:mb-0">
        {children}
      </pre>
    ),
    table: ({ children }) => (
      <div className="mb-3 overflow-x-auto last:mb-0">
        <table className="w-full border-collapse text-sm">{children}</table>
      </div>
    ),
    th: ({ children }) => (
      <th className="border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-3 py-2 text-left text-xs font-semibold text-gray-900 dark:text-gray-100">
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td className="border border-gray-200 dark:border-gray-700 px-3 py-2 text-xs text-gray-700 dark:text-gray-300">
        {children}
      </td>
    ),
    a: ({ href, children }) => (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 underline hover:text-blue-800"
      >
        {children}
      </a>
    ),
    hr: () => <hr className="my-4 border-gray-200 dark:border-gray-700" />,
    input: ({ type, checked }) => {
      if (type !== "checkbox") return null;
      return (
        <input
          type="checkbox"
          checked={!!checked}
          onChange={(e) => {
            const container = e.currentTarget.closest("[data-notes]");
            if (!container) return;
            const all = container.querySelectorAll('input[type="checkbox"]');
            const idx = Array.from(all).indexOf(e.currentTarget);
            if (idx !== -1) void handleCheckboxToggle(idx);
          }}
          className="mr-1.5 cursor-pointer align-middle"
        />
      );
    },
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex w-full max-w-2xl flex-col gap-4 rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-2">
            <div
              className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${
                task.isEvent ? "bg-amber-400" : task.done ? "bg-gray-300 dark:bg-gray-600" : "bg-gray-800 dark:bg-gray-300"
              }`}
            />
            <h2
              className={`wrap-break-word text-base font-semibold leading-snug ${
                task.done ? "text-gray-400 dark:text-gray-500 line-through" : "text-gray-900 dark:text-gray-100"
              }`}
            >
              {task.title}
            </h2>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {!task.isEvent && (
              <button
                onClick={onToggle}
                className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs transition ${
                  task.done
                    ? "border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800"
                    : "border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
                }`}
              >
                <Check size={11} />
                {task.done ? t("team_task_detail_undo") : t("team_task_detail_done")}
              </button>
            )}
            <button
              onClick={onEdit}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-gray-700 px-2.5 py-1.5 text-xs text-gray-600 dark:text-gray-400 transition hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <Pencil size={11} />
              {t("team_task_detail_edit")}
            </button>
            <button
              onClick={onClose}
              aria-label={t("close")}
              className="rounded-md p-1 text-gray-400 dark:text-gray-500 transition hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600 dark:hover:text-gray-300"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Meta */}
        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
          <span>{dateLabel ?? <span className="italic text-gray-400 dark:text-gray-500">{t("no_date")}</span>}</span>
          {assignee && (
            <div className="flex items-center gap-1.5">
              <Avatar
                name={assignee.name ?? undefined}
                avatarUrl={assignee.avatarUrl ?? undefined}
              />
              <span>{assignee.name ?? t("team_task_unknown")}</span>
            </div>
          )}
        </div>

        {/* Notes */}
        {notes ? (
          <div
            data-notes="true"
            className="max-h-[60vh] overflow-y-auto rounded-lg bg-gray-50 dark:bg-gray-950 px-4 py-3"
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkBreaks]}
              rehypePlugins={[rehypeHighlight]}
              components={components}
            >
              {notes}
            </ReactMarkdown>
          </div>
        ) : (
          <p className="text-xs italic text-gray-400 dark:text-gray-500">{t("team_task_detail_no_notes")}</p>
        )}
      </div>
    </div>
  );
}
