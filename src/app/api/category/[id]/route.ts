import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

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
  const { name } = await request.json();

  await prisma.category.update({
    where: { id, userId: user.id },
    data: { name },
  });

  return new Response(null, { status: 204 });
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

  await prisma.task.updateMany({
    where: { categoryId: id, userId: user.id },
    data: { categoryId: null },
  });

  await prisma.category.delete({
    where: { id, userId: user.id },
  });

  return new Response(null, { status: 204 });
}
