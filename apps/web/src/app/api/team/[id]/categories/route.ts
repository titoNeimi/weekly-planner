import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { getProfile, getTeamMember } from "@/lib/team-auth";
import { isValidCategoryColor } from "@/lib/category-colors";

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
  const [member, profile] = await Promise.all([
    getTeamMember(user.id, id),
    getProfile(user.id),
  ]);

  if (!member && profile?.role !== "ADMIN")
    return Response.json({ error: "Forbidden" }, { status: 403 });

  const categories = await prisma.teamCategory.findMany({
    where: { teamId: id },
    orderBy: { name: "asc" },
  });

  return Response.json(categories);
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
  const [member, profile] = await Promise.all([
    getTeamMember(user.id, id),
    getProfile(user.id),
  ]);

  const canManage =
    profile?.role === "ADMIN" ||
    member?.role === "OWNER" ||
    member?.role === "ADMIN";
  if (!canManage) return Response.json({ error: "Forbidden" }, { status: 403 });

  const { name, color, discordChannel, reminderHours } = await request.json();

  if (!name?.trim() || !isValidCategoryColor(color))
    return Response.json({ error: "Missing required fields" }, { status: 400 });

  const category = await prisma.teamCategory.create({
    data: {
      name: name.trim(),
      color,
      teamId: id,
      discordChannel: discordChannel?.trim() || null,
      reminderHours: reminderHours ? Number(reminderHours) : null,
    },
  });

  return Response.json(category, { status: 201 });
}
