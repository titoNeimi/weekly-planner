import { isValidCategoryColor } from "@/lib/category-colors";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const categories = await prisma.category.findMany({
    where: { userId: user.id },
    // `id` breaks ties deterministically for categories that share a
    // `createdAt` (e.g. every pre-existing row, backfilled to the same
    // migration-time value) — cuids are themselves roughly time-ordered, so
    // this also approximates creation order for those rows.
    orderBy: [{ pinned: "desc" }, { createdAt: "asc" }, { id: "asc" }],
  });

  return Response.json(categories);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
  const { name, color} = body;

  if (!name?.trim() || !color) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (!isValidCategoryColor(color)) {
    return Response.json({ error: "Invalid color" }, { status: 400 });
  }

  const category = await prisma.category.create({
    data: {
      name: name.trim(),
      color: color,
      userId: user.id,
    },
  });

  return Response.json(category, { status: 201 });
}
