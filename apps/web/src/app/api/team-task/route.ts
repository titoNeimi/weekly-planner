import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const from = request.nextUrl.searchParams.get("from");
  const to = request.nextUrl.searchParams.get("to");
  const assignedToMe =
    request.nextUrl.searchParams.get("assignedToMe") === "true";

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const memberFilter = { team: { members: { some: { userId: user.id } } } };
  const assigneeFilter = assignedToMe
    ? { assignedTo: { userId: user.id } }
    : {};

  const where =
    from && to
      ? {
          ...memberFilter,
          ...assigneeFilter,
          date: { gte: new Date(from), lte: new Date(to) },
        }
      : {
          ...memberFilter,
          ...assigneeFilter,
          OR: [
            { date: { gte: today } },
            { AND: [{ date: { lt: today } }, { done: false }] },
          ],
        };

  const tasks = await prisma.teamTask.findMany({
    where,
    include: {
      team: { select: { id: true, name: true } },
      assignedTo: {
        select: { profile: { select: { name: true, avatarUrl: true } } },
      },
    },
    orderBy: { date: "asc" },
  });

  return Response.json(tasks);
}
