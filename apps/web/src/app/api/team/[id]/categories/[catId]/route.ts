import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { getProfile, getTeamMember } from "@/lib/team-auth";
import { isValidCategoryColor } from "@/lib/category-colors";

async function canManageCategory(userId: string, teamId: string) {
  const [member, profile] = await Promise.all([
    getTeamMember(userId, teamId),
    getProfile(userId),
  ]);
  return (
    profile?.role === "ADMIN" ||
    member?.role === "OWNER" ||
    member?.role === "ADMIN"
  );
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; catId: string }> },
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id, catId } = await params;

  if (!(await canManageCategory(user.id, id)))
    return Response.json({ error: "Forbidden" }, { status: 403 });

  const category = await prisma.teamCategory.findUnique({
    where: { id: catId, teamId: id },
  });
  if (!category) return Response.json({ error: "Not found" }, { status: 404 });

  const body = await request.json();
  const { name, color, discordChannel, reminderHours } = body;

  if (name !== undefined && !name?.trim())
    return Response.json({ error: "Name cannot be empty" }, { status: 400 });
  if (color !== undefined && !isValidCategoryColor(color))
    return Response.json({ error: "Invalid color" }, { status: 400 });

  const updated = await prisma.teamCategory.update({
    where: { id: catId },
    data: {
      ...(name !== undefined && { name: name.trim() }),
      ...(color !== undefined && { color }),
      ...("discordChannel" in body && {
        discordChannel: discordChannel?.trim() || null,
      }),
      ...("reminderHours" in body && {
        reminderHours: reminderHours ? Number(reminderHours) : null,
      }),
    },
  });

  return Response.json(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; catId: string }> },
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id, catId } = await params;

  if (!(await canManageCategory(user.id, id)))
    return Response.json({ error: "Forbidden" }, { status: 403 });

  const category = await prisma.teamCategory.findUnique({
    where: { id: catId, teamId: id },
  });
  if (!category) return Response.json({ error: "Not found" }, { status: 404 });

  await prisma.$transaction([
    prisma.teamTask.updateMany({
      where: { teamCategoryId: catId },
      data: { teamCategoryId: null },
    }),
    prisma.teamCategory.delete({ where: { id: catId } }),
  ]);

  return new Response(null, { status: 204 });
}
