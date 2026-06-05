import { createClient } from "@/lib/supabase/server";
import { getProfile, getTeamMember } from "@/lib/team-auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const guildId = searchParams.get("guild_id");
  const teamId = searchParams.get("state");

  if (!guildId || !teamId) redirect("/teams");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [profile, member] = await Promise.all([
    getProfile(user.id),
    getTeamMember(user.id, teamId),
  ]);

  const canManage =
    profile?.role === "ADMIN" ||
    member?.role === "OWNER" ||
    member?.role === "ADMIN";

  if (!canManage) redirect(`/teams/${teamId}`);

  await prisma.team.update({
    where: { id: teamId },
    data: { discordGuildId: guildId },
  });

  redirect(`/teams/${teamId}`);
}
