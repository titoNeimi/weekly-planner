import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { getTeamMember } from "@/lib/team-auth";
import { NextRequest } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const actorMember = await getTeamMember(user.id, id);

  const assignedTo = request.nextUrl.searchParams.get("assignedTo");

  if (!actorMember)
    return Response.json({ error: "Forbidden" }, { status: 403 });

  const teamTasks = await prisma.teamTask.findMany({
    where: { teamId: id, assignedToId: assignedTo ? assignedTo : undefined },
  });

  return Response.json(teamTasks);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const actorMember = await getTeamMember(user.id, id);
  if (!actorMember)
    return Response.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const { title, notes, date, assignedToId } = body;

  if (!title?.trim() || !date) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  const task = await prisma.teamTask.create({
    data: {
      title: title.trim(),
      notes: notes ?? null,
      date: new Date(date),
      teamId: id,
      assignedToId: assignedToId ?? null,
      createdByUserId: user.id,
    },
  });

  return Response.json(task, { status: 201 });
}
