"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Copy, Link2, Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import Avatar from "@/components/avatar";
import TeamTasksSection from "./TeamTasksSection";
import TeamCategoriesSection, { type TeamCategoryData } from "./TeamCategoriesSection";
import { useLanguage } from "@/context/LanguageContext";

type MemberRow = {
  id: string;
  userId: string;
  role: "OWNER" | "ADMIN" | "USER";
  joinedAt: string;
  profile: { name: string | null; avatarUrl: string | null };
};

type InviteRow = {
  id: string;
  code: string;
  maxUses: number;
  uses: number;
  endDate: string | null;
  createdAt: string;
};

type TeamData = {
  id: string;
  name: string;
  discordGuildId: string | null;
  members: MemberRow[];
  invitations: InviteRow[];
};

const ROLE_COLORS: Record<string, string> = {
  OWNER: "bg-purple-100 text-purple-700",
  ADMIN: "bg-blue-100 text-blue-700",
  USER: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400",
};

function isExpired(inv: InviteRow): boolean {
  if (inv.uses >= inv.maxUses) return true;
  if (inv.endDate && new Date(inv.endDate) < new Date()) return true;
  return false;
}

export default function TeamDetail({
  team,
  myRole,
  myMemberId,
  myUserId,
  isGlobalAdmin,
}: {
  team: TeamData;
  myRole: "OWNER" | "ADMIN" | "USER" | null;
  myMemberId: string | null;
  myUserId: string;
  isGlobalAdmin: boolean;
}) {
  const router = useRouter();
  const { t, tpl, lang } = useLanguage();
  const locale = lang === "es" ? "es-ES" : "en-US";

  const ROLE_LABELS: Record<string, string> = {
    OWNER: "Owner",
    ADMIN: t("team_settings_role_admin"),
    USER: t("team_settings_role_member"),
  };

  function formatDate(dateStr: string | null): string {
    if (!dateStr) return lang === "es" ? "Sin vencimiento" : "No expiry";
    return new Date(dateStr).toLocaleDateString(locale, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  const canManage = isGlobalAdmin || myRole === "OWNER" || myRole === "ADMIN";
  const isOwner = isGlobalAdmin || myRole === "OWNER";

  const [tab, setTab] = useState<"tasks" | "settings">("tasks");
  const [discordGuildId, setDiscordGuildId] = useState(team.discordGuildId);
  const [categories, setCategories] = useState<TeamCategoryData[]>([]);
  const [disconnecting, setDisconnecting] = useState(false);

  useEffect(() => {
    fetch(`/api/team/${team.id}/categories`)
      .then((r) => r.json())
      .then(setCategories)
      .catch(() => {});
  }, [team.id]);

  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(team.name);
  const [savingName, setSavingName] = useState(false);

  const [removingId, setRemovingId] = useState<string | null>(null);
  const [changingRoleId, setChangingRoleId] = useState<string | null>(null);

  const [showCreateInvite, setShowCreateInvite] = useState(false);
  const [inviteMaxUses, setInviteMaxUses] = useState("10");
  const [inviteEndDate, setInviteEndDate] = useState("");
  const [creatingInvite, setCreatingInvite] = useState(false);

  const [deletingTeam, setDeletingTeam] = useState(false);

  async function saveName() {
    const trimmed = nameInput.trim();
    if (!trimmed || trimmed === team.name) {
      setEditingName(false);
      return;
    }
    setSavingName(true);
    try {
      const res = await fetch(`/api/team/${team.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      if (!res.ok) throw new Error();
      toast.success("Team renamed");
      router.refresh();
    } catch {
      toast.error("Failed to rename team");
    } finally {
      setSavingName(false);
      setEditingName(false);
    }
  }

  async function removeMember(memberId: string) {
    setRemovingId(memberId);
    try {
      const res = await fetch(`/api/team/${team.id}/members/${memberId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      toast.success("Member removed");
      router.refresh();
    } catch {
      toast.error("Failed to remove member");
    } finally {
      setRemovingId(null);
    }
  }

  async function changeRole(memberId: string, role: string) {
    setChangingRoleId(memberId);
    try {
      const res = await fetch(`/api/team/${team.id}/members/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) throw new Error();
      toast.success("Role updated");
      router.refresh();
    } catch {
      toast.error("Failed to update role");
    } finally {
      setChangingRoleId(null);
    }
  }

  async function createInvite(e: React.FormEvent) {
    e.preventDefault();
    setCreatingInvite(true);
    try {
      const res = await fetch(`/api/team/${team.id}/invitations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          maxUses: Number(inviteMaxUses) || 10,
          endDate: inviteEndDate || undefined,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Invite link created");
      setShowCreateInvite(false);
      setInviteMaxUses("10");
      setInviteEndDate("");
      router.refresh();
    } catch {
      toast.error("Failed to create invite link");
    } finally {
      setCreatingInvite(false);
    }
  }

  async function disconnectDiscord() {
    setDisconnecting(true);
    try {
      const res = await fetch(`/api/team/${team.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ discordGuildId: null }),
      });
      if (!res.ok) throw new Error();
      setDiscordGuildId(null);
      toast.success("Discord disconnected");
    } catch {
      toast.error("Failed to disconnect Discord");
    } finally {
      setDisconnecting(false);
    }
  }

  async function revokeInvite(invId: string) {
    try {
      const res = await fetch(`/api/team/${team.id}/invitations/${invId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      toast.success("Invite link revoked");
      router.refresh();
    } catch {
      toast.error("Failed to revoke invite link");
    }
  }

  function copyInviteLink(code: string) {
    const url = `${window.location.origin}/invite/${code}`;
    navigator.clipboard.writeText(url).then(
      () => toast.success("Link copied"),
      () => toast.error("Failed to copy"),
    );
  }

  async function deleteTeam() {
    if (!confirm(`Delete "${team.name}"? This cannot be undone.`)) return;
    setDeletingTeam(true);
    try {
      const res = await fetch(`/api/team/${team.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Team deleted");
      router.push("/teams");
    } catch {
      toast.error("Failed to delete team");
      setDeletingTeam(false);
    }
  }

  const showTasks = !canManage || tab === "tasks";
  const showSettings = canManage && tab === "settings";

  return (
    <div className="flex flex-col gap-5">

      {/* Back */}
      <Link
        href="/teams"
        className="flex w-fit items-center gap-1 text-sm text-gray-500 dark:text-gray-400 transition hover:text-gray-800 dark:hover:text-gray-100"
      >
        <ChevronLeft className="h-4 w-4" />
        {t("nav_teams")}
      </Link>

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{team.name}</h1>
        {canManage && (
          <div className="flex overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-medium">
            <button
              onClick={() => setTab("tasks")}
              className={`px-4 py-1.5 transition-colors ${
                tab === "tasks"
                  ? "bg-primary text-white"
                  : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-800 dark:hover:text-gray-100"
              }`}
            >
              {t("team_tab_tasks")}
            </button>
            <button
              onClick={() => setTab("settings")}
              className={`border-l border-gray-200 dark:border-gray-700 px-4 py-1.5 transition-colors ${
                tab === "settings"
                  ? "bg-primary text-white"
                  : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-800 dark:hover:text-gray-100"
              }`}
            >
              {t("team_tab_settings")}
            </button>
          </div>
        )}
      </div>

      {/* Tasks tab */}
      {showTasks && (
        <div className="flex items-start gap-6">

          {/* Task list */}
          <div className="min-w-0 flex-1">
            <TeamTasksSection
              teamId={team.id}
              members={team.members}
              categories={categories}
              myUserId={myUserId}
              myRole={myRole}
              isGlobalAdmin={isGlobalAdmin}
            />
          </div>

          {/* Member sidebar */}
          <div className="hidden w-52 shrink-0 sm:block">
            <div className="rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 shadow-sm">
              <p className="mb-3 text-sm font-medium text-gray-500 dark:text-gray-400">
                {tpl("team_members_header", { n: team.members.length })}
              </p>
              <ul className="flex flex-col gap-2.5">
                {team.members.map((m) => (
                  <li key={m.id} className="flex items-center gap-2.5">
                    <Avatar
                      name={m.profile.name ?? undefined}
                      avatarUrl={m.profile.avatarUrl ?? undefined}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-gray-800 dark:text-gray-200">
                        {m.profile.name ?? m.userId}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${ROLE_COLORS[m.role]}`}
                    >
                      {ROLE_LABELS[m.role]}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

        </div>
      )}

      {/* Settings tab */}
      {showSettings && (
        <div className="flex flex-col gap-8">

          {/* ── General ── */}
          <section className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{t("team_settings_general")}</h2>

            <div className="rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 px-5 py-4">
              {editingName ? (
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    autoFocus
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveName();
                      if (e.key === "Escape") {
                        setEditingName(false);
                        setNameInput(team.name);
                      }
                    }}
                    className="rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-sm text-gray-900 dark:text-gray-100 outline-none focus:border-gray-400 dark:focus:border-gray-500"
                  />
                  <button
                    onClick={saveName}
                    disabled={savingName}
                    className="cursor-pointer rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-white transition hover:bg-primary-hover disabled:opacity-50"
                  >
                    {savingName ? t("saving") : t("team_settings_save_name")}
                  </button>
                  <button
                    onClick={() => { setEditingName(false); setNameInput(team.name); }}
                    className="cursor-pointer rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 transition hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    {t("cancel")}
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{t("team_settings_name")}</p>
                    <p className="mt-0.5 text-sm text-gray-900 dark:text-gray-100">{team.name}</p>
                  </div>
                  <button
                    onClick={() => setEditingName(true)}
                    className="cursor-pointer text-gray-400 dark:text-gray-500 transition hover:text-gray-700 dark:hover:text-gray-200"
                    aria-label={t("team_settings_rename")}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* ── People ── */}
          <section className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{t("team_settings_people")}</h2>

            {/* Members */}
            <div className="overflow-hidden rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
              <div className="flex items-center justify-between border-b border-gray-50 dark:border-gray-900 px-5 py-3">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {tpl("team_members_header", { n: team.members.length })}
                </p>
              </div>
              <ul className="divide-y divide-gray-50 dark:divide-gray-800">
                {team.members.map((m) => (
                  <li
                    key={m.id}
                    className="flex items-center justify-between px-5 py-3"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar
                        name={m.profile.name ?? undefined}
                        avatarUrl={m.profile.avatarUrl ?? undefined}
                      />
                      <span className="truncate text-sm text-gray-900 dark:text-gray-100">
                        {m.profile.name ?? m.userId}
                      </span>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      {isOwner && m.role !== "OWNER" ? (
                        <select
                          value={m.role}
                          disabled={changingRoleId === m.id}
                          onChange={(e) => changeRole(m.id, e.target.value)}
                          className="cursor-pointer rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-2.5 py-0.5 text-xs font-medium text-gray-700 dark:text-gray-300 disabled:opacity-50"
                        >
                          <option value="ADMIN">{t("team_settings_role_admin")}</option>
                          <option value="USER">{t("team_settings_role_member")}</option>
                        </select>
                      ) : (
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${ROLE_COLORS[m.role]}`}
                        >
                          {ROLE_LABELS[m.role]}
                        </span>
                      )}
                      {canManage && m.role !== "OWNER" && (
                        <button
                          onClick={() => removeMember(m.id)}
                          disabled={removingId === m.id}
                          title={m.id === myMemberId ? "Leave team" : "Remove member"}
                          className="cursor-pointer text-gray-300 dark:text-gray-600 transition hover:text-red-500 disabled:opacity-40"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Invite links */}
            <div className="overflow-hidden rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
              <div className="flex items-center justify-between border-b border-gray-50 dark:border-gray-900 px-5 py-3">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{t("team_settings_invite_links")}</p>
                <button
                  onClick={() => setShowCreateInvite((v) => !v)}
                  className="flex cursor-pointer items-center gap-1 text-sm text-gray-500 dark:text-gray-400 transition hover:text-gray-900 dark:hover:text-gray-100"
                >
                  <Plus className="h-3.5 w-3.5" />
                  {t("team_settings_new_link")}
                </button>
              </div>

              {showCreateInvite && (
                <form
                  onSubmit={createInvite}
                  className="flex flex-wrap items-end gap-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 px-5 py-4"
                >
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                      {t("team_settings_max_uses")}
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={inviteMaxUses}
                      onChange={(e) => setInviteMaxUses(e.target.value)}
                      className="w-24 rounded-lg border border-gray-200 dark:border-gray-700 px-2.5 py-1.5 text-sm outline-none focus:border-gray-400 dark:focus:border-gray-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                      {t("team_settings_expires")}
                    </label>
                    <input
                      type="date"
                      value={inviteEndDate}
                      onChange={(e) => setInviteEndDate(e.target.value)}
                      className="rounded-lg border border-gray-200 dark:border-gray-700 px-2.5 py-1.5 text-sm outline-none focus:border-gray-400 dark:focus:border-gray-500"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowCreateInvite(false)}
                      className="cursor-pointer rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 transition hover:bg-white"
                    >
                      {t("cancel")}
                    </button>
                    <button
                      type="submit"
                      disabled={creatingInvite}
                      className="cursor-pointer rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-white transition hover:bg-primary-hover disabled:opacity-50"
                    >
                      {creatingInvite ? t("creating") : t("team_settings_create_link")}
                    </button>
                  </div>
                </form>
              )}

              {team.invitations.length === 0 && !showCreateInvite ? (
                <p className="px-5 py-6 text-center text-sm text-gray-400 dark:text-gray-500">
                  {t("team_settings_no_links")}
                </p>
              ) : (
                <ul className="divide-y divide-gray-50 dark:divide-gray-800">
                  {team.invitations.map((inv) => {
                    const expired = isExpired(inv);
                    return (
                      <li
                        key={inv.id}
                        className="flex items-center justify-between gap-4 px-5 py-3"
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <Link2 className="h-4 w-4 shrink-0 text-gray-300 dark:text-gray-600" />
                          <span
                            className={`truncate font-mono text-xs ${
                              expired ? "text-gray-300 dark:text-gray-600 line-through" : "text-gray-600 dark:text-gray-400"
                            }`}
                          >
                            /invite/{inv.code}
                          </span>
                          {expired && (
                            <span className="shrink-0 rounded-full bg-red-50 px-2 py-0.5 text-xs text-red-500">
                              {t("team_settings_expired")}
                            </span>
                          )}
                        </div>
                        <div className="flex shrink-0 items-center gap-4">
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            {inv.uses}/{inv.maxUses} uses
                          </span>
                          <span className="hidden text-xs text-gray-400 dark:text-gray-500 sm:block">
                            {formatDate(inv.endDate)}
                          </span>
                          <button
                            onClick={() => copyInviteLink(inv.code)}
                            title={t("team_settings_copy")}
                            className="cursor-pointer text-gray-400 dark:text-gray-500 transition hover:text-gray-700 dark:hover:text-gray-200"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => revokeInvite(inv.id)}
                            title={t("team_settings_revoke")}
                            className="cursor-pointer text-gray-300 dark:text-gray-600 transition hover:text-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </section>

          {/* ── Integrations ── */}
          <section className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{t("team_settings_integrations")}</h2>

            {/* Discord row */}
            <div className="rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 px-5 py-4">
              <div className="flex items-center justify-between gap-6">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{t("team_settings_discord")}</p>
                  <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                    {discordGuildId
                      ? t("team_settings_discord_connected")
                      : t("team_settings_discord_add")}
                  </p>
                  {discordGuildId && (
                    <p className="mt-0.5 truncate font-mono text-xs text-gray-400 dark:text-gray-500">
                      {tpl("team_settings_discord_guild", { id: discordGuildId })}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {discordGuildId ? (
                    <>
                      <span className="rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
                        {t("team_settings_connected")}
                      </span>
                      <button
                        onClick={disconnectDiscord}
                        disabled={disconnecting}
                        className="cursor-pointer rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 transition hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
                      >
                        {disconnecting ? t("team_settings_disconnecting") : t("team_settings_disconnect")}
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => {
                        const callbackUrl = `${window.location.origin}/api/discord/callback`;
                        window.location.href = `https://discord.com/oauth2/authorize?client_id=${process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID}&scope=bot+applications.commands&permissions=2147503104&redirect_uri=${encodeURIComponent(callbackUrl)}&response_type=code&state=${team.id}`;
                      }}
                      className="cursor-pointer rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-indigo-500"
                    >
                      {t("team_settings_add_discord")}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Categories */}
            <TeamCategoriesSection
              teamId={team.id}
              canManage={canManage}
              discordGuildId={discordGuildId}
              categories={categories}
              onCategoriesChange={setCategories}
            />
          </section>

          {/* ── Danger Zone ── */}
          {isOwner && (
            <div className="border-t border-red-100 pt-8">
              <div className="flex items-start justify-between gap-6">
                <div>
                  <p className="text-sm font-semibold text-red-600">
                    {t("team_settings_danger")}
                  </p>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {t("team_settings_danger_subtitle")}
                  </p>
                </div>
                <button
                  onClick={deleteTeam}
                  disabled={deletingTeam}
                  className="shrink-0 cursor-pointer rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                >
                  {deletingTeam ? t("team_settings_deleting") : t("team_settings_delete")}
                </button>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
