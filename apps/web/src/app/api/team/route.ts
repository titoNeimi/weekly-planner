import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/team-auth";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const page = Number(request.nextUrl.searchParams.get("page") ?? "1");
  const limit = Number(request.nextUrl.searchParams.get("limit") ?? "20");

  const admin = await isAdmin(user.id);

  const where = admin ? {} : { members: { some: { userId: user.id } } };

  const [teams, total] = await prisma.$transaction([
    prisma.team.findMany({ where, skip: (page - 1) * limit, take: limit }),
    prisma.team.count({ where }),
  ]);

  return Response.json({ total, teams });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { name } = body;

  if (!name?.trim()) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  const team = await prisma.$transaction(async (tx) => {
    const created = await tx.team.create({ data: { name: name.trim() } });
    await tx.teamMember.create({
      data: { teamId: created.id, userId: user.id, role: "OWNER" },
    });
    return created;
  });

  return Response.json(team, { status: 201 });
}
