import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { getProfile, getTeamMember, getTeamWithMembers } from "@/lib/team-auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { name } = await request.json();

  if (!name?.trim())
    return Response.json({ error: "Missing required fields" }, { status: 400 });

  const [profile, teamMember] = await Promise.all([
    getProfile(user.id),
    getTeamMember(user.id, id),
  ]);

  const canUpdate =
    profile?.role === "ADMIN" ||
    teamMember?.role === "OWNER" ||
    teamMember?.role === "ADMIN";

  if (!canUpdate) return Response.json({ error: "Forbidden" }, { status: 403 });

  await prisma.team.update({ where: { id }, data: { name: name.trim() } });
  return new Response(null, { status: 204 });
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

  const [profile, teamMember] = await Promise.all([
    getProfile(user.id),
    getTeamMember(user.id, id),
  ]);

  if (profile?.role !== "ADMIN" && !teamMember) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const team = await getTeamWithMembers(id);
  if (!team) return Response.json({ error: "Not found" }, { status: 404 });

  return Response.json(team);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const [profile, teamMember] = await Promise.all([
    getProfile(user.id),
    getTeamMember(user.id, id),
  ]);

  const canDelete = profile?.role === "ADMIN" || teamMember?.role === "OWNER";
  if (!canDelete) return Response.json({ error: "Forbidden" }, { status: 403 });

  await prisma.$transaction([
    prisma.teamTask.deleteMany({ where: { teamId: id } }),
    prisma.invitation.deleteMany({ where: { teamId: id } }),
    prisma.teamMember.deleteMany({ where: { teamId: id } }),
    prisma.team.delete({ where: { id } }),
  ]);

  return new Response(null, { status: 204 });
}
