import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { getProfile, getTeamMember } from "@/lib/team-auth";
import { TeamRole } from "@/generated/prisma/enums";

const ASSIGNABLE_ROLES: TeamRole[] = ["ADMIN", "USER"];

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; memberId: string }> },
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id, memberId } = await params;
  const { role } = await request.json();

  if (!ASSIGNABLE_ROLES.includes(role))
    return Response.json({ error: "Invalid role" }, { status: 400 });

  const [profile, actorMember] = await Promise.all([
    getProfile(user.id),
    getTeamMember(user.id, id),
  ]);

  const canManage = profile?.role === "ADMIN" || actorMember?.role === "OWNER";
  if (!canManage) return Response.json({ error: "Forbidden" }, { status: 403 });

  const target = await prisma.teamMember.findUnique({
    where: { id: memberId, teamId: id },
  });
  if (!target) return Response.json({ error: "Not found" }, { status: 404 });
  if (target.role === "OWNER")
    return Response.json(
      { error: "Cannot change owner role" },
      { status: 403 },
    );

  const updated = await prisma.teamMember.update({
    where: { id: memberId },
    data: { role },
  });

  return Response.json(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; memberId: string }> },
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id, memberId } = await params;

  const [profile, actorMember] = await Promise.all([
    getProfile(user.id),
    getTeamMember(user.id, id),
  ]);

  const canManage =
    profile?.role === "ADMIN" ||
    actorMember?.role === "OWNER" ||
    actorMember?.role === "ADMIN";

  if (!canManage) return Response.json({ error: "Forbidden" }, { status: 403 });

  const target = await prisma.teamMember.findUnique({
    where: { id: memberId, teamId: id },
  });
  if (!target) return Response.json({ error: "Not found" }, { status: 404 });
  if (target.role === "OWNER")
    return Response.json(
      { error: "Cannot remove team owner" },
      { status: 403 },
    );

  await prisma.teamMember.delete({ where: { id: memberId } });
  return new Response(null, { status: 204 });
}
