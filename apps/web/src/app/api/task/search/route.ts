import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return Response.json({ tasks: [], teamTasks: [] });

  const [tasks, teamTasks] = await Promise.all([
    prisma.task.findMany({
      where: {
        userId: user.id,
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { notes: { contains: q, mode: "insensitive" } },
        ],
      },
      include: { category: { select: { id: true, name: true, color: true } } },
      orderBy: { date: "desc" },
      take: 8,
    }),
    prisma.teamTask.findMany({
      where: {
        team: { members: { some: { userId: user.id } } },
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { notes: { contains: q, mode: "insensitive" } },
        ],
      },
      include: { team: { select: { id: true, name: true } } },
      orderBy: { date: "desc" },
      take: 8,
    }),
  ]);

  return Response.json({
    tasks: tasks.map((t) => ({
      id: t.id,
      title: t.title,
      date: t.date ? t.date.toISOString() : null,
      isEvent: t.isEvent,
      done: t.done,
      category: t.category,
    })),
    teamTasks: teamTasks.map((t) => ({
      id: t.id,
      title: t.title,
      date: t.date ? t.date.toISOString() : null,
      isEvent: t.isEvent,
      done: t.done,
      teamId: t.teamId,
      teamName: t.team.name,
    })),
  });
}
