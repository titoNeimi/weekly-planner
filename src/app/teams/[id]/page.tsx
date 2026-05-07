import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { getProfile, getTeamMember, getTeamWithMembers } from "@/lib/team-auth";
import { redirect, notFound } from "next/navigation";
import TeamDetail from "./TeamDetail";

export default async function TeamDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [profile, myMember, team] = await Promise.all([
    getProfile(user.id),
    getTeamMember(user.id, id),
    getTeamWithMembers(id),
  ]);

  if (!team) notFound();

  const isGlobalAdmin = profile?.role === "ADMIN";
  if (!isGlobalAdmin && !myMember) redirect("/teams");

  const canManageInvitations =
    isGlobalAdmin || myMember?.role === "OWNER" || myMember?.role === "ADMIN";

  const invitations = canManageInvitations
    ? await prisma.invitation.findMany({
        where: { teamId: id },
        orderBy: { createdAt: "desc" },
      })
    : [];

  return (
    <main className="flex-1 bg-gray-50 px-3 py-4 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-5xl">
        <TeamDetail
          team={{
            id: team.id,
            name: team.name,
            members: team.members.map((m) => ({
              id: m.id,
              userId: m.userId,
              role: m.role,
              joinedAt: m.joinedAt.toISOString(),
              profile: { name: m.profile.name, avatarUrl: m.profile.avatarUrl },
            })),
            invitations: invitations.map((inv) => ({
              id: inv.id,
              code: inv.code,
              maxUses: inv.maxUses,
              uses: inv.uses,
              endDate: inv.endDate?.toISOString() ?? null,
              createdAt: inv.createdAt.toISOString(),
            })),
          }}
          myRole={myMember?.role ?? null}
          myMemberId={myMember?.id ?? null}
          isGlobalAdmin={isGlobalAdmin}
        />
      </div>
    </main>
  );
}
