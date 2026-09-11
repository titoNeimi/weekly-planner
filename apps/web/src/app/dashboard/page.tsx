import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import TaskOverview from "./TaskOverview";
import { getNextRecurringInstances } from "@/lib/get-tasks-for-range";
import type { WeekStartsOn } from "@/lib/week";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const [profile, allTasks, categories, recurringInstances, rawTeamTasks] =
    await Promise.all([
      prisma.profile.findUnique({
        where: { userId: user.id },
        select: { weekStartsOn: true },
      }),
      prisma.task.findMany({
        where: {
          userId: user.id,
          OR: [
            { date: null, done: false },
            { date: { gte: today } },
            { date: { lt: today }, done: false, isEvent: false },
          ],
        },
        include: {
          category: { select: { id: true, name: true, color: true } },
        },
        orderBy: { date: "asc" },
      }),
      prisma.category.findMany({
        where: { userId: user.id },
        select: { id: true, name: true, color: true, pinned: true },
        // `id` breaks ties deterministically when `createdAt` is equal (e.g.
        // every pre-existing row, backfilled to the same migration-time
        // value); cuids are themselves roughly time-ordered.
        orderBy: [{ pinned: "desc" }, { createdAt: "asc" }, { id: "asc" }],
      }),
      getNextRecurringInstances(user.id, today),
      prisma.teamTask.findMany({
        where: {
          team: { members: { some: { userId: user.id } } },
          AND: [
            {
              OR: [{ assignedToId: null }, { assignedTo: { userId: user.id } }],
            },
            {
              OR: [
                { date: null, done: false },
                { date: { gte: today } },
                { AND: [{ date: { lt: today } }, { done: false }, { isEvent: false }] },
              ],
            },
          ],
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

  // Undated tasks have no date; keep them separate from the recurring merge.
  const undated = allTasks.filter((t) => t.date === null);
  const dated = allTasks.filter((t) => t.date !== null) as Array<
    (typeof allTasks)[0] & { date: Date }
  >;

  const datedWithRecurring = [...dated, ...recurringInstances].sort(
    (a, b) => a.date.getTime() - b.date.getTime(),
  );

  const serializedTasks = [
    ...datedWithRecurring.map((t) => ({
      ...t,
      date: t.date.toISOString(),
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    })),
    ...undated.map((t) => ({
      ...t,
      date: null,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    })),
  ];

  return (
    <main className="flex-1 bg-gray-50 dark:bg-gray-950 px-4 py-6 sm:px-6 sm:py-8">
      <TaskOverview
        tasks={serializedTasks}
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
        weekStartsOn={(profile?.weekStartsOn === 0 ? 0 : 1) as WeekStartsOn}
      />
    </main>
  );
}
