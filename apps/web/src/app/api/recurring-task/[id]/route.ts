import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { type, interval, endDate, endCount, title, categoryId, notes } =
    await request.json();

  const recurring = await prisma.recurringTask.findFirst({
    where: { id, userId: user.id },
  });
  if (!recurring) return Response.json({ error: "Not found" }, { status: 404 });

  if (interval !== undefined && interval < 1) {
    return Response.json({ error: "interval must be >= 1" }, { status: 400 });
  }

  const updatedEndDate =
    endDate !== undefined ? (endDate ? new Date(endDate) : null) : recurring.endDate;
  const updatedEndCount: number | null =
    endCount !== undefined ? endCount : recurring.endCount;

  if (!updatedEndDate && !updatedEndCount) {
    return Response.json(
      { error: "Recurring task requires endDate or endCount" },
      { status: 400 },
    );
  }

  const data: Record<string, unknown> = {};
  if (type !== undefined) data.type = type;
  if (interval !== undefined) data.interval = interval;
  if (title !== undefined) data.title = title.trim();
  if (categoryId !== undefined) data.categoryId = categoryId ?? null;
  if (notes !== undefined) data.notes = notes?.trim() || null;
  data.endDate = updatedEndDate;
  data.endCount = updatedEndCount;

  const updated = await prisma.recurringTask.update({ where: { id }, data });

  return Response.json(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const recurring = await prisma.recurringTask.findFirst({
    where: { id, userId: user.id },
  });
  if (!recurring) return Response.json({ error: "Not found" }, { status: 404 });

  await prisma.$transaction(async (tx) => {
    // Detach any materialized exceptions so the FK constraint is satisfied.
    await tx.task.updateMany({
      where: { recurringTaskId: id, userId: user.id },
      data: { recurringTaskId: null },
    });
    await tx.recurringTask.delete({ where: { id } });
  });

  return new Response(null, { status: 204 });
}
