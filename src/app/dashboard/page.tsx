import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import TaskOverview from "./TaskOverview";
import { getNextRecurringInstances } from "@/lib/get-tasks-for-range";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const [tasks, categories, recurringInstances, rawTeamTasks] =
    await Promise.all([
      prisma.task.findMany({
        where: {
          userId: user.id,
          OR: [{ date: { gte: today } }, { date: { lt: today }, done: false }],
        },
        include: {
          category: { select: { id: true, name: true, color: true } },
        },
        orderBy: { date: "asc" },
      }),
      prisma.category.findMany({ where: { userId: user.id } }),
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
                { date: { gte: today } },
                { AND: [{ date: { lt: today } }, { done: false }] },
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

  const allTasks = [...tasks, ...recurringInstances].sort(
    (a, b) => a.date.getTime() - b.date.getTime(),
  );

  return (
    <main className="flex-1 bg-gray-50 px-3 py-4 sm:px-6 sm:py-8">
      <TaskOverview
        tasks={allTasks.map((t) => ({
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
      />
    </main>
  );
}
