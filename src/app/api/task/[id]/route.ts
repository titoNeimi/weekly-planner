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
  const { done, title, categoryId, notes, date, time } = await request.json();

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

  await prisma.task.deleteMany({
    where: { id, userId: user.id },
  });

  return new Response(null, { status: 204 });
}
