import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import WeekView from "../dashboard/WeekView";
import { getTasksForRange } from "@/lib/get-tasks-for-range";

function getWeekStart(dateStr?: string): Date {
  const base = dateStr ? new Date(dateStr) : new Date();
  const day = base.getUTCDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(base);
  monday.setUTCDate(base.getUTCDate() + diffToMonday);
  monday.setUTCHours(0, 0, 0, 0);
  return monday;
}

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { week } = await searchParams;
  const monday = getWeekStart(week);

  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  sunday.setUTCHours(23, 59, 59, 999);

  const [tasks, categories, rawTeamTasks] = await Promise.all([
    getTasksForRange(user.id, monday, sunday),
    prisma.category.findMany({ where: { userId: user.id } }),
    prisma.teamTask.findMany({
      where: {
        team: { members: { some: { userId: user.id } } },
        assignedTo: { userId: user.id },
        date: { gte: monday, lte: sunday },
      },
      include: {
        team: { select: { id: true, name: true } },
        assignedTo: {
          select: { profile: { select: { name: true, avatarUrl: true } } },
        },
      },
      orderBy: { date: "asc" },
    }),
  ]);

  return (
    <main className="flex-1 bg-gray-50 px-3 py-4 sm:px-6 sm:py-8">
      <WeekView
        tasks={tasks.map((t) => ({
          ...t,
          date: t.date.toISOString(),
          createdAt: t.createdAt.toISOString(),
          updatedAt: t.updatedAt.toISOString(),
        }))}
        teamTasks={rawTeamTasks.map((t) => ({
          id: t.id,
          title: t.title,
          notes: t.notes,
          date: t.date.toISOString(),
          done: t.done,
          teamId: t.teamId,
          teamName: t.team.name,
          assignedToName: t.assignedTo?.profile.name ?? null,
          assignedToAvatarUrl: t.assignedTo?.profile.avatarUrl ?? null,
          createdByUserId: t.createdByUserId,
          createdAt: t.createdAt.toISOString(),
          updatedAt: t.updatedAt.toISOString(),
        }))}
        categories={categories}
        weekStart={monday.toISOString()}
      />
    </main>
  );
}
