import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const tasks = await prisma.task.findMany({
    where: {
      userId: user.id,
      date: {
        gte: from ? new Date(from) : undefined,
        lte: to ? new Date(to) : undefined,
      },
    },
    include: { category: { select: { id: true, name: true, color: true } } },
    orderBy: { createdAt: "asc" },
  });

  return Response.json(tasks);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { title, categoryId, notes, date, time } = body;

  if (!title?.trim() || !date) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  const task = await prisma.task.create({
    data: {
      title: title.trim(),
      categoryId: categoryId || null,
      notes: notes?.trim() || null,
      date: new Date(`${date}T${time ?? "00:00"}:00.000Z`),
      userId: user.id,
    },
    include: { category: { select: { id: true, name: true, color: true } } },
  });

  return Response.json(task, { status: 201 });
}
