"use client";

import { useState } from "react";
import { Users } from "lucide-react";
import type { SerializedTeamTask } from "./WeekView";

export default function TeamTaskItem({ task }: { task: SerializedTeamTask }) {
  const [done, setDone] = useState(task.done);
  const [loading, setLoading] = useState(false);

  async function handleToggle() {
    const next = !done;
    setDone(next);
    setLoading(true);
    try {
      const res = await fetch(`/api/team/${task.teamId}/task/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ done: next }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setDone(!next);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className={`rounded-lg border px-3 py-2 transition ${
        done
          ? "border-gray-100 bg-gray-50"
          : "border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm"
      }`}
    >
      <div className="flex items-start gap-2">
        <button
          onClick={handleToggle}
          disabled={loading}
          aria-label={done ? "Mark incomplete" : "Mark complete"}
          className={`mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border transition disabled:opacity-50 ${
            done
              ? "border-gray-300 bg-gray-300"
              : "border-gray-300 bg-white hover:border-gray-500"
          }`}
        />
        <div className="min-w-0 flex-1">
          <p
            className={`wrap-break-word text-sm font-medium leading-snug ${
              done ? "text-gray-300 line-through" : "text-gray-800"
            }`}
          >
            {task.title}
          </p>
          {task.notes && (
            <p
              className={`mt-1 wrap-break-word text-xs leading-relaxed ${
                done ? "text-gray-300" : "text-gray-400"
              }`}
            >
              {task.notes}
            </p>
          )}
          <div className="mt-1.5 flex items-center gap-1">
            <Users
              size={10}
              className={done ? "text-gray-300" : "text-blue-400"}
            />
            <span
              className={`text-[10px] font-medium ${done ? "text-gray-300" : "text-blue-500"}`}
            >
              {task.teamName}
            </span>
            {task.assignedToName && (
              <span
                className={`text-[10px] ${done ? "text-gray-300" : "text-gray-400"}`}
              >
                · {task.assignedToName}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
