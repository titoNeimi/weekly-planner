import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import type { NextRequest } from "next/server";
import { getTasksForRange } from "@/lib/get-tasks-for-range";
import { makeVirtualId, type RecurringTypeValue } from "@/lib/recurring-tasks";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const isDoneParam = searchParams.get("done");

  const isDone = isDoneParam
    ? isDoneParam.toLocaleLowerCase() === "true"
    : undefined;

  // When no date range is given, or filtering by done status, skip virtual generation.
  if (!from || !to || isDone === true) {
    const tasks = await prisma.task.findMany({
      where: {
        userId: user.id,
        date: {
          gte: from ? new Date(from) : undefined,
          lte: to ? new Date(to) : undefined,
        },
        done: isDone,
      },
      include: { category: { select: { id: true, name: true, color: true } } },
      orderBy: { date: "asc" },
    });
    return Response.json(tasks);
  }

  const tasks = await getTasksForRange(user.id, new Date(from), new Date(to));
  return Response.json(tasks);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { title, categoryId, notes, date, time, recurringTask } = body;

  if (!title?.trim() || !date) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  const taskDate = new Date(`${date}T${time ?? "00:00"}:00.000Z`);

  if (!recurringTask) {
    const task = await prisma.task.create({
      data: {
        title: title.trim(),
        categoryId: categoryId || null,
        notes: notes?.trim() || null,
        date: taskDate,
        userId: user.id,
      },
      include: { category: { select: { id: true, name: true, color: true } } },
    });
    return Response.json(task, { status: 201 });
  }

  const { type, interval, endDate, endCount } = recurringTask;

  if (!type || !interval || interval < 1) {
    return Response.json(
      { error: "Recurring task requires type and interval >= 1" },
      { status: 400 },
    );
  }
  if (!endDate && !endCount) {
    return Response.json(
      { error: "Recurring task requires endDate or endCount" },
      { status: 400 },
    );
  }

  const parsedEndDate = endDate ? new Date(endDate) : null;

  if (parsedEndDate && parsedEndDate < taskDate) {
    return Response.json(
      { error: "endDate must be on or after the task start date" },
      { status: 400 },
    );
  }

  // Only the template is stored — no Task rows are written.
  const recurring = await prisma.recurringTask.create({
    data: {
      title: title.trim(),
      userId: user.id,
      type,
      interval,
      startDate: taskDate,
      endDate: parsedEndDate,
      endCount: endCount ?? null,
      categoryId: categoryId || null,
      notes: notes?.trim() || null,
    },
    include: { category: { select: { id: true, name: true, color: true } } },
  });

  // Return a virtual instance shaped like a Task so the frontend's onSaved works.
  return Response.json(
    {
      id: makeVirtualId(recurring.id, taskDate),
      title: recurring.title,
      categoryId: recurring.categoryId,
      category: recurring.category,
      notes: recurring.notes,
      done: false,
      date: taskDate.toISOString(),
      userId: user.id,
      recurringTaskId: recurring.id,
      createdAt: recurring.createdAt.toISOString(),
      updatedAt: recurring.updatedAt.toISOString(),
    },
    { status: 201 },
  );
}
