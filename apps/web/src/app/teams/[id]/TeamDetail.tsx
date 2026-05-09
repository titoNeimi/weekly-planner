"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  Copy,
  Link2,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import Avatar from "@/components/avatar";
import TeamTasksSection from "./TeamTasksSection";

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
  members: MemberRow[];
  invitations: InviteRow[];
};

const ROLE_LABELS: Record<string, string> = {
  OWNER: "Owner",
  ADMIN: "Admin",
  USER: "Member",
};

const ROLE_COLORS: Record<string, string> = {
  OWNER: "bg-purple-100 text-purple-700",
  ADMIN: "bg-blue-100 text-blue-700",
  USER: "bg-gray-100 text-gray-600",
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "No expiry";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

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

  const canManage = isGlobalAdmin || myRole === "OWNER" || myRole === "ADMIN";
  const isOwner = isGlobalAdmin || myRole === "OWNER";

  // Name editing
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(team.name);
  const [savingName, setSavingName] = useState(false);

  // Member actions
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [changingRoleId, setChangingRoleId] = useState<string | null>(null);

  // Invite creation
  const [showCreateInvite, setShowCreateInvite] = useState(false);
  const [inviteMaxUses, setInviteMaxUses] = useState("10");
  const [inviteEndDate, setInviteEndDate] = useState("");
  const [creatingInvite, setCreatingInvite] = useState(false);

  // Delete team
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
      () => toast.success("Link copied to clipboard"),
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

  return (
    <div className="flex flex-col gap-6">
      {/* Back */}
      <Link
        href="/teams"
        className="flex w-fit items-center gap-1 text-sm text-gray-500 transition hover:text-gray-800"
      >
        <ChevronLeft className="h-4 w-4" />
        Teams
      </Link>

      {/* Header */}
      <div className="flex items-center gap-3">
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
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-xl font-semibold text-gray-900 outline-none focus:border-gray-500"
            />
            <button
              onClick={saveName}
              disabled={savingName}
              className="cursor-pointer rounded-lg bg-gray-900 px-3 py-1.5 text-sm text-white transition hover:bg-gray-700 disabled:opacity-50"
            >
              {savingName ? "Saving…" : "Save"}
            </button>
            <button
              onClick={() => {
                setEditingName(false);
                setNameInput(team.name);
              }}
              className="cursor-pointer rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 transition hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        ) : (
          <>
            <h1 className="text-xl font-semibold text-gray-900">{team.name}</h1>
            {canManage && (
              <button
                onClick={() => setEditingName(true)}
                className="cursor-pointer text-gray-400 transition hover:text-gray-700"
              >
                <Pencil className="h-4 w-4" />
              </button>
            )}
          </>
        )}
      </div>

      {/* Tasks */}
      <TeamTasksSection
        teamId={team.id}
        members={team.members}
        myUserId={myUserId}
        myRole={myRole}
        isGlobalAdmin={isGlobalAdmin}
      />

      {/* Members */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 className="text-sm font-semibold text-gray-900">
            Members{" "}
            <span className="font-normal text-gray-400">
              ({team.members.length})
            </span>
          </h2>
        </div>
        <ul className="divide-y divide-gray-50">
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
                <span className="truncate text-sm text-gray-900">
                  {m.profile.name ?? m.userId}
                </span>
              </div>

              <div className="flex shrink-0 items-center gap-3">
                {isOwner && m.role !== "OWNER" ? (
                  <select
                    value={m.role}
                    disabled={changingRoleId === m.id}
                    onChange={(e) => changeRole(m.id, e.target.value)}
                    className="cursor-pointer rounded-full border border-gray-200 bg-white px-2.5 py-0.5 text-xs font-medium text-gray-700 disabled:opacity-50"
                  >
                    <option value="ADMIN">Admin</option>
                    <option value="USER">Member</option>
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
                    className="cursor-pointer text-gray-300 transition hover:text-red-500 disabled:opacity-40"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Invite Links */}
      {canManage && (
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-gray-900">
              Invite Links
            </h2>
            <button
              onClick={() => setShowCreateInvite(!showCreateInvite)}
              className="flex cursor-pointer items-center gap-1 text-sm text-gray-500 transition hover:text-gray-900"
            >
              <Plus className="h-4 w-4" />
              New link
            </button>
          </div>

          {showCreateInvite && (
            <form
              onSubmit={createInvite}
              className="flex flex-wrap items-end gap-4 border-b border-gray-100 bg-gray-50 px-5 py-4"
            >
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  Max uses
                </label>
                <input
                  type="number"
                  min="1"
                  value={inviteMaxUses}
                  onChange={(e) => setInviteMaxUses(e.target.value)}
                  className="w-24 rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm outline-none focus:border-gray-400"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  Expires on{" "}
                  <span className="font-normal text-gray-400">(optional)</span>
                </label>
                <input
                  type="date"
                  value={inviteEndDate}
                  onChange={(e) => setInviteEndDate(e.target.value)}
                  className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm outline-none focus:border-gray-400"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateInvite(false)}
                  className="cursor-pointer rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 transition hover:bg-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingInvite}
                  className="cursor-pointer rounded-lg bg-gray-900 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-gray-700 disabled:opacity-50"
                >
                  {creatingInvite ? "Creating…" : "Create"}
                </button>
              </div>
            </form>
          )}

          {team.invitations.length === 0 && !showCreateInvite ? (
            <p className="px-5 py-8 text-center text-sm text-gray-400">
              No invite links yet. Create one to share with others.
            </p>
          ) : (
            <ul className="divide-y divide-gray-50">
              {team.invitations.map((inv) => {
                const expired = isExpired(inv);
                return (
                  <li
                    key={inv.id}
                    className="flex items-center justify-between gap-4 px-5 py-3"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <Link2 className="h-4 w-4 shrink-0 text-gray-400" />
                      <span
                        className={`truncate font-mono text-xs ${expired ? "text-gray-300 line-through" : "text-gray-600"}`}
                      >
                        /invite/{inv.code}
                      </span>
                      {expired && (
                        <span className="shrink-0 rounded-full bg-red-50 px-2 py-0.5 text-xs text-red-500">
                          expired
                        </span>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-4">
                      <span className="text-xs text-gray-400">
                        {inv.uses}/{inv.maxUses} uses
                      </span>
                      <span className="hidden text-xs text-gray-400 sm:block">
                        {formatDate(inv.endDate)}
                      </span>
                      <button
                        onClick={() => copyInviteLink(inv.code)}
                        title="Copy link"
                        className="cursor-pointer text-gray-400 transition hover:text-gray-700"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => revokeInvite(inv.id)}
                        title="Revoke"
                        className="cursor-pointer text-gray-300 transition hover:text-red-500"
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
      )}

      {/* Danger zone */}
      {isOwner && (
        <div className="overflow-hidden rounded-2xl border border-red-100 bg-white shadow-sm">
          <div className="border-b border-red-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-red-600">Danger Zone</h2>
          </div>
          <div className="flex items-center justify-between px-5 py-4">
            <div>
              <p className="text-sm font-medium text-gray-900">
                Delete this team
              </p>
              <p className="text-xs text-gray-500">
                Permanently removes the team and all members. Cannot be undone.
              </p>
            </div>
            <button
              onClick={deleteTeam}
              disabled={deletingTeam}
              className="shrink-0 cursor-pointer rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
            >
              {deletingTeam ? "Deleting…" : "Delete team"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
