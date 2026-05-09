import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { getProfile, getTeamMember } from "@/lib/team-auth";
import { randomBytes } from "crypto";

async function assertCanManageInvitations(userId: string, teamId: string) {
  const [profile, teamMember] = await Promise.all([
    getProfile(userId),
    getTeamMember(userId, teamId),
  ]);
  const allowed =
    profile?.role === "ADMIN" ||
    teamMember?.role === "OWNER" ||
    teamMember?.role === "ADMIN";
  return allowed;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  if (!(await assertCanManageInvitations(user.id, id))) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const invitations = await prisma.invitation.findMany({
    where: { teamId: id },
    orderBy: { createdAt: "desc" },
  });

  return Response.json(invitations);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  if (!(await assertCanManageInvitations(user.id, id))) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const team = await prisma.team.findUnique({ where: { id } });
  if (!team) return Response.json({ error: "Not found" }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  const maxUses: number = body.maxUses ?? 10;
  const endDate: string | undefined = body.endDate;

  const code = randomBytes(6).toString("base64url");

  const invitation = await prisma.invitation.create({
    data: {
      code,
      teamId: id,
      maxUses,
      endDate: endDate ? new Date(endDate) : null,
      createdByUserId: user.id,
    },
  });

  return Response.json(invitation, { status: 201 });
}
