import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { getProfile } from "@/lib/team-auth";
import { redirect } from "next/navigation";
import TeamsClient from "./TeamsClient";

export default async function TeamsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await getProfile(user.id);
  const isAdmin = profile?.role === "ADMIN";

  const teams = await prisma.team.findMany({
    where: isAdmin ? {} : { members: { some: { userId: user.id } } },
    include: {
      _count: { select: { members: true } },
      members: {
        where: { userId: user.id },
        select: { role: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="flex-1 bg-gray-50 px-3 py-4 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-5xl">
        <TeamsClient
          teams={teams.map((t) => ({
            id: t.id,
            name: t.name,
            createdAt: t.createdAt.toISOString(),
            memberCount: t._count.members,
            myRole: (t.members[0]?.role ?? null) as
              | "OWNER"
              | "ADMIN"
              | "USER"
              | null,
          }))}
        />
      </div>
    </main>
  );
}
