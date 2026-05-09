import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { getProfile, getTeamMember } from "@/lib/team-auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; taskId: string }> },
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id, taskId } = await params;

  const actorMember = await getTeamMember(user.id, id);
  if (!actorMember)
    return Response.json({ error: "Forbidden" }, { status: 403 });

  const task = await prisma.teamTask.findUnique({
    where: { id: taskId, teamId: id },
  });
  if (!task) return Response.json({ error: "Not found" }, { status: 404 });

  const body = await request.json();
  const { title, notes, date, done, assignedToId } = body;

  if (title !== undefined && !title?.trim())
    return Response.json({ error: "Title cannot be empty" }, { status: 400 });

  const updated = await prisma.teamTask.update({
    where: { id: taskId },
    data: {
      ...(title !== undefined && { title: title.trim() }),
      ...(notes !== undefined && { notes: notes ?? null }),
      ...(date !== undefined && { date: new Date(date) }),
      ...(done !== undefined && { done: Boolean(done) }),
      ...("assignedToId" in body && { assignedToId: assignedToId ?? null }),
    },
  });

  return Response.json(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; taskId: string }> },
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id, taskId } = await params;

  const [profile, actorMember] = await Promise.all([
    getProfile(user.id),
    getTeamMember(user.id, id),
  ]);

  if (!actorMember)
    return Response.json({ error: "Forbidden" }, { status: 403 });

  const task = await prisma.teamTask.findUnique({
    where: { id: taskId, teamId: id },
  });
  if (!task) return Response.json({ error: "Not found" }, { status: 404 });

  const canDelete =
    profile?.role === "ADMIN" ||
    actorMember.role === "OWNER" ||
    actorMember.role === "ADMIN" ||
    task.createdByUserId === user.id;

  if (!canDelete) return Response.json({ error: "Forbidden" }, { status: 403 });

  await prisma.teamTask.delete({ where: { id: taskId } });
  return new Response(null, { status: 204 });
}
