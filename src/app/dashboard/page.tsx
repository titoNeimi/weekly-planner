import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import WeekView from "./WeekView";

function getWeekStart(dateStr?: string): Date {
  const base = dateStr ? new Date(dateStr) : new Date();
  const day = base.getUTCDay(); // 0 = Sunday
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(base);
  monday.setUTCDate(base.getUTCDate() + diffToMonday);
  monday.setUTCHours(0, 0, 0, 0);
  return monday;
}

export default async function DashboardPage({
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
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  const [tasks, categories] = await Promise.all([
    prisma.task.findMany({
      where: {
        userId: user.id,
        date: { gte: monday, lte: sunday },
      },
      include: { category: { select: { id: true, name: true, color: true } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.category.findMany({
      where: { userId: user.id },
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
        categories={categories}
        weekStart={monday.toISOString()}
      />
    </main>
  );
}
