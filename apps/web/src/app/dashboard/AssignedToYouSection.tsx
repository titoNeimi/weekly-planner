"use client";

import { useState } from "react";
import type { SerializedTeamTask } from "./WeekView";
import TeamTaskItem from "./TeamTaskItem";
import { useLanguage } from "@/context/LanguageContext";

export default function AssignedToYouSection({
  upcomingDates,
  upcomingByDate,
  pastDates,
  pastByDate,
  undatedTasks,
  formatDateLabel,
}: {
  upcomingDates: string[];
  upcomingByDate: Record<string, SerializedTeamTask[]>;
  pastDates: string[];
  pastByDate: Record<string, SerializedTeamTask[]>;
  undatedTasks: SerializedTeamTask[];
  formatDateLabel: (dateStr: string) => string;
}) {
  const { t } = useLanguage();
  const [pastHidden, setPastHidden] = useState(true);

  const isEmpty =
    upcomingDates.length === 0 && pastDates.length === 0 && undatedTasks.length === 0;
  if (isEmpty) return null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-gray-100" />
        <span className="text-xs font-medium text-gray-400">
          {t("assigned_section_title")}
        </span>
        <div className="h-px flex-1 bg-gray-100" />
      </div>

      {upcomingDates.length > 0 && (
        <div className="flex flex-col gap-6">
          {upcomingDates.map((dateStr) => (
            <div key={dateStr} className="flex flex-col gap-2.5">
              <h2 className="text-sm font-medium text-gray-500">
                {formatDateLabel(dateStr)}
              </h2>
              <div className="flex flex-col gap-2.5">
                {(upcomingByDate[dateStr] ?? []).map((task) => (
                  <TeamTaskItem key={task.id} task={task} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {undatedTasks.length > 0 && (
        <div className="flex flex-col gap-2.5">
          {undatedTasks.map((task) => (
            <TeamTaskItem key={task.id} task={task} />
          ))}
        </div>
      )}

      {pastDates.length > 0 && (
        <div className="flex flex-col gap-4">
          <button
            onClick={() => setPastHidden((v) => !v)}
            className="flex items-center gap-2 text-xs text-gray-400 transition hover:text-gray-600"
          >
            <span>{t("overview_past")}</span>
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">
              {pastDates.reduce((sum, d) => sum + (pastByDate[d]?.length ?? 0), 0)}
            </span>
            <span className="text-gray-300">{pastHidden ? "↓" : "↑"}</span>
          </button>

          {!pastHidden && (
            <div className="flex flex-col gap-6">
              {pastDates.map((dateStr) => (
                <div key={dateStr} className="flex flex-col gap-2.5">
                  <h2 className="text-xs font-medium text-gray-400">
                    {formatDateLabel(dateStr)}
                  </h2>
                  <div className="flex flex-col gap-2.5">
                    {(pastByDate[dateStr] ?? []).map((task) => (
                      <TeamTaskItem key={task.id} task={task} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
