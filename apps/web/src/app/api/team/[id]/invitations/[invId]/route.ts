import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { getProfile, getTeamMember } from "@/lib/team-auth";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; invId: string }> },
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id, invId } = await params;

  const [profile, teamMember] = await Promise.all([
    getProfile(user.id),
    getTeamMember(user.id, id),
  ]);

  const canManage =
    profile?.role === "ADMIN" ||
    teamMember?.role === "OWNER" ||
    teamMember?.role === "ADMIN";

  if (!canManage) return Response.json({ error: "Forbidden" }, { status: 403 });

  const invitation = await prisma.invitation.findUnique({
    where: { id: invId, teamId: id },
  });
  if (!invitation)
    return Response.json({ error: "Not found" }, { status: 404 });

  await prisma.invitation.delete({ where: { id: invId } });
  return new Response(null, { status: 204 });
}
