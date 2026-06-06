import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/team-auth";
import { prisma } from "@/lib/prisma";

type RawChannel = { id: string; name: string; type: number };

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ guildId: string }> },
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { guildId } = await params;
  const profile = await getProfile(user.id);

  const team = await prisma.team.findFirst({
    where: {
      discordGuildId: guildId,
      ...(profile?.role !== "ADMIN" && {
        members: { some: { userId: user.id } },
      }),
    },
  });

  if (!team) return Response.json({ error: "Forbidden" }, { status: 403 });

  if (!process.env.DISCORD_TOKEN) {
    console.error("[discord/channels] DISCORD_TOKEN env var is not set");
    return Response.json({ error: "Discord not configured" }, { status: 502 });
  }

  const res = await fetch(
    `https://discord.com/api/v10/guilds/${guildId}/channels`,
    { headers: { Authorization: `Bot ${process.env.DISCORD_TOKEN}` } },
  );

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(`[discord/channels] Discord API ${res.status}: ${body}`);
    return Response.json({ error: "Failed to fetch channels" }, { status: 502 });
  }

  const raw: RawChannel[] = await res.json();

  return Response.json(
    raw
      .filter((c) => c.type === 0) // GUILD_TEXT only
      .map((c) => ({ id: c.id, name: c.name }))
      .sort((a, b) => a.name.localeCompare(b.name)),
  );
}
