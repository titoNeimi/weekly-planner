import { prisma, Prisma } from "@weekly-planner/db";
import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";

type Task = Prisma.TeamTaskGetPayload<{
  include: { assignedTo: { include: { profile: true } } };
}>;

export const data = new SlashCommandBuilder()
  .setName("list-tasks")
  .setDescription("List pending tasks for this channel");

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  // Route by channel first: find the category linked to this channel, then its team.
  // This handles multiple teams sharing the same guild correctly.
  const channelCategory = await prisma.teamCategory.findFirst({
    where: { discordChannel: interaction.channelId },
    include: { team: true },
  });

  let team = channelCategory?.team ?? null;
  let categories: { id: string; name: string }[] = channelCategory
    ? [{ id: channelCategory.id, name: channelCategory.name }]
    : [];

  if (!team) {
    // Fallback: find teams linked to this guild
    const teams = await prisma.team.findMany({
      where: { discordGuildId: interaction.guildId! },
    });

    if (teams.length === 0) {
      await interaction.editReply(
        "This server is not linked to a team. Go to the web app to connect it.",
      );
      return;
    }

    if (teams.length > 1) {
      await interaction.editReply(
        "Multiple teams are linked to this server. Use a channel that is linked to a category.",
      );
      return;
    }

    team = teams[0];
  }

  const tasks = await prisma.teamTask.findMany({
    where: {
      teamId: team.id,
      done: false,
      ...(categories.length > 0 && {
        teamCategoryId: { in: categories.map((c) => c.id) },
      }),
    },
    include: { assignedTo: { include: { profile: true } } },
    orderBy: { date: "asc" },
  });

  if (tasks.length === 0) {
    await interaction.editReply("✅ No pending tasks.");
    return;
  }

  const now = new Date();
  const overdue = tasks.filter((t) => t.date < now);
  const upcoming = tasks.filter((t) => t.date >= now);

  const scope =
    categories.length > 0
      ? categories.map((c) => c.name).join(", ")
      : team.name;

  const lines: string[] = [`📋 **${scope}** — ${tasks.length} pending\n`];

  if (overdue.length > 0) {
    lines.push("**🔴 Overdue**");
    lines.push(...overdue.map(formatTask));
    if (upcoming.length > 0) lines.push("");
  }

  if (upcoming.length > 0) {
    if (overdue.length > 0) lines.push("**📅 Upcoming**");
    lines.push(...upcoming.map(formatTask));
  }

  await interaction.editReply(lines.join("\n"));
}

function formatTask(task: Task): string {
  const assignee = task.assignedTo?.profile.name ?? "Unassigned";
  const date = task.date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  return `• **${task.title}** · ${assignee} · ${date}`;
}
