import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { parseVirtualId } from "@/lib/recurring-tasks";

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
  const { done, title, categoryId, notes, date, time } = await request.json();

  // Virtual task: materialize it with the patch already applied so we only
  // need one write. The new row gets a real cuid — the virtual ID is discarded.
  const virtual = parseVirtualId(id);
  if (virtual) {
    const recurring = await prisma.recurringTask.findFirst({
      where: { id: virtual.recurringTaskId, userId: user.id },
    });
    if (!recurring)
      return Response.json({ error: "Not found" }, { status: 404 });

    const overrides: Record<string, unknown> = {};
    if (done !== undefined) overrides.done = done;
    if (title !== undefined) overrides.title = title.trim();
    if (categoryId !== undefined) overrides.categoryId = categoryId ?? null;
    if (notes !== undefined) overrides.notes = notes?.trim() || null;
    if (date !== undefined)
      overrides.date = new Date(`${date}T${time ?? "00:00"}:00.000Z`);

    const task = await prisma.$transaction(async (tx) => {
      // Suppress this occurrence from the virtual series permanently.
      await tx.recurringTask.update({
        where: { id: virtual.recurringTaskId },
        data: { deletedOccurrences: { push: virtual.date } },
      });
      // Create a fully standalone task — no recurringTaskId link.
      return tx.task.create({
        data: {
          title: recurring.title,
          categoryId: recurring.categoryId,
          notes: recurring.notes,
          date: virtual.date,
          userId: user.id,
          ...overrides,
        },
        include: {
          category: { select: { id: true, name: true, color: true } },
        },
      });
    });

    return Response.json(task);
  }

  const data: Record<string, unknown> = {};
  if (done !== undefined) data.done = done;
  if (title !== undefined) data.title = title.trim();
  if (categoryId !== undefined) data.categoryId = categoryId ?? null;
  if (notes !== undefined) data.notes = notes?.trim() || null;
  if (date !== undefined)
    data.date = new Date(`${date}T${time ?? "00:00"}:00.000Z`);

  await prisma.task.updateMany({ where: { id, userId: user.id }, data });

  const task = await prisma.task.findFirst({
    where: { id, userId: user.id },
    include: { category: { select: { id: true, name: true, color: true } } },
  });

  return Response.json(task);
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

  // Virtual task: record the skipped date on the template instead of writing
  // a Task row, so the GET keeps filtering it out.
  const virtual = parseVirtualId(id);
  if (virtual) {
    await prisma.recurringTask.updateMany({
      where: { id: virtual.recurringTaskId, userId: user.id },
      data: { deletedOccurrences: { push: virtual.date } },
    });
    return new Response(null, { status: 204 });
  }

  await prisma.task.deleteMany({ where: { id, userId: user.id } });

  return new Response(null, { status: 204 });
}
