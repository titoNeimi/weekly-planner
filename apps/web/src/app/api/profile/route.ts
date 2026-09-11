import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await prisma.profile.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      name: user.user_metadata?.full_name ?? null,
      avatarUrl: user.user_metadata?.avatar_url ?? null,
    },
    select: { weekStartsOn: true },
  });

  return Response.json(profile);
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { weekStartsOn } = await request.json();
  if (weekStartsOn !== 0 && weekStartsOn !== 1) {
    return Response.json({ error: "Invalid weekStartsOn" }, { status: 400 });
  }

  const profile = await prisma.profile.upsert({
    where: { userId: user.id },
    update: { weekStartsOn },
    create: {
      userId: user.id,
      name: user.user_metadata?.full_name ?? null,
      avatarUrl: user.user_metadata?.avatar_url ?? null,
      weekStartsOn,
    },
    select: { weekStartsOn: true },
  });

  return Response.json(profile);
}
