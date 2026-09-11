import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import WeekView from "../dashboard/WeekView";
import { getTasksForRange } from "@/lib/get-tasks-for-range";
import { startOfWeekUTC } from "@/lib/week";
import type { WeekStartsOn } from "@/lib/week";

function getWeekStart(weekStartsOn: WeekStartsOn, dateStr?: string): Date {
  const base = dateStr ? new Date(dateStr) : new Date();
  return startOfWeekUTC(base, weekStartsOn);
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

  const profile = await prisma.profile.findUnique({
    where: { userId: user.id },
    select: { weekStartsOn: true },
  });
  const weekStartsOn: WeekStartsOn = profile?.weekStartsOn === 0 ? 0 : 1;

  const monday = getWeekStart(weekStartsOn, week);

  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  sunday.setUTCHours(23, 59, 59, 999);

  const [tasks, categories, rawTeamTasks] = await Promise.all([
    getTasksForRange(user.id, monday, sunday),
    prisma.category.findMany({
      where: { userId: user.id },
      select: { id: true, name: true, color: true, pinned: true },
      // `id` breaks ties deterministically when `createdAt` is equal (e.g.
      // every pre-existing row, backfilled to the same migration-time
      // value); cuids are themselves roughly time-ordered.
      orderBy: [{ pinned: "desc" }, { createdAt: "asc" }, { id: "asc" }],
    }),
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
    <main className="flex-1 bg-gray-50 dark:bg-gray-950 px-3 py-4 sm:px-6 sm:py-8">
      <WeekView
        tasks={tasks.map((t) => ({
          ...t,
          date: t.date ? t.date.toISOString() : null,
          createdAt: t.createdAt.toISOString(),
          updatedAt: t.updatedAt.toISOString(),
        }))}
        teamTasks={rawTeamTasks.map((t) => ({
          id: t.id,
          title: t.title,
          notes: t.notes,
          date: t.date ? t.date.toISOString() : null,
          done: t.done,
          isEvent: t.isEvent,
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
        weekStartsOn={weekStartsOn}
      />
    </main>
  );
}
