"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Users, Plus, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/context/LanguageContext";

type TeamListItem = {
  id: string;
  name: string;
  createdAt: string;
  memberCount: number;
  myRole: "OWNER" | "ADMIN" | "USER" | null;
};

const ROLE_LABELS: Record<string, string> = {
  OWNER: "Owner",
  ADMIN: "Admin",
  USER: "Member",
};

const ROLE_COLORS: Record<string, string> = {
  OWNER: "bg-purple-100 text-purple-700",
  ADMIN: "bg-blue-100 text-blue-700",
  USER: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400",
};

export default function TeamsClient({ teams }: { teams: TeamListItem[] }) {
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const { t, tpl } = useLanguage();

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (!res.ok) throw new Error();
      const team = await res.json();
      router.push(`/teams/${team.id}`);
    } catch {
      toast.error("Failed to create team");
      setCreating(false);
    }
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{t("teams_title")}</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-white transition hover:bg-primary-hover"
        >
          <Plus className="h-4 w-4" />
          {t("teams_new")}
        </button>
      </div>

      {teams.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 py-16 text-center shadow-sm">
          <Users className="h-10 w-10 text-gray-300 dark:text-gray-600" />
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{t("teams_none")}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t("teams_none_subtitle")}</p>
          <button
            onClick={() => setShowCreate(true)}
            className="mt-1 cursor-pointer rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-hover"
          >
            {t("teams_create")}
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {teams.map((team) => (
            <Link
              key={team.id}
              href={`/teams/${team.id}`}
              className="flex items-center justify-between rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 px-5 py-4 shadow-sm transition hover:border-gray-200 hover:shadow"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{team.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {tpl("teams_members", {
                      n: team.memberCount,
                      s: team.memberCount !== 1 ? "s" : "",
                    })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {team.myRole && (
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${ROLE_COLORS[team.myRole]}`}
                  >
                    {ROLE_LABELS[team.myRole]}
                  </span>
                )}
                <ChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500" />
              </div>
            </Link>
          ))}
        </div>
      )}

      {showCreate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowCreate(false);
          }}
        >
          <div className="w-full max-w-sm rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-xl">
            <h2 className="mb-4 text-base font-semibold text-gray-900 dark:text-gray-100">
              {t("teams_create")}
            </h2>
            <form onSubmit={handleCreate} className="flex flex-col gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t("teams_name_label")}
                </label>
                <input
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("teams_name_placeholder")}
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm outline-none focus:border-gray-400 dark:focus:border-gray-500"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="flex-1 cursor-pointer rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 transition hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  {t("cancel")}
                </button>
                <button
                  type="submit"
                  disabled={!name.trim() || creating}
                  className="flex-1 cursor-pointer rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white transition hover:bg-primary-hover disabled:opacity-50"
                >
                  {creating ? t("creating") : t("create")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
