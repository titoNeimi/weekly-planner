import { prisma } from "@/lib/prisma";
import type { Profile, TeamMember } from "@weekly-planner/db";

export async function getTeamWithMembers(teamId: string) {
  return prisma.team.findUnique({
    where: { id: teamId },
    include: {
      members: {
        include: { profile: true },
      },
    },
  });
}

export async function getProfile(userId: string): Promise<Profile | null> {
  return prisma.profile.findUnique({ where: { userId } });
}

export async function getTeamMember(
  userId: string,
  teamId: string,
): Promise<TeamMember | null> {
  return prisma.teamMember.findFirst({ where: { userId, teamId } });
}

export async function canAccessTeam(
  userId: string,
  teamId: string,
): Promise<boolean> {
  const [profile, member] = await Promise.all([
    getProfile(userId),
    getTeamMember(userId, teamId),
  ]);
  return profile?.role === "ADMIN" || member !== null;
}

export async function requireTeamAccess(
  userId: string,
  teamId: string,
): Promise<Response | null> {
  const allowed = await canAccessTeam(userId, teamId);
  if (!allowed) return new Response("Forbidden", { status: 403 });
  return null;
}

export async function isAdmin(userId: string): Promise<boolean> {
  const profile = await getProfile(userId);
  return profile?.role === "ADMIN";
}

export async function getInvitationByCode(code: string) {
  return prisma.invitation.findUnique({
    where: { code },
    include: { team: true },
  });
}

export function isInvitationValid(invitation: {
  uses: number;
  maxUses: number;
  endDate: Date | null;
}): boolean {
  if (invitation.uses >= invitation.maxUses) return false;
  if (invitation.endDate && invitation.endDate < new Date()) return false;
  return true;
}
