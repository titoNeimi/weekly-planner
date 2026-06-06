import { prisma, Prisma } from "@weekly-planner/db";
import { TextChannel } from "discord.js";
import { schedule } from "node-cron";
import { client } from "../lib/client";

type DueTask = Prisma.TeamTaskGetPayload<{
  include: { teamCategory: true; assignedTo: { include: { profile: true } } };
}>;

async function fetchDueTasks(): Promise<DueTask[]> {
  return prisma.teamTask.findMany({
    where: {
      done: false,
      reminderSentAt: null,
      reminderAt: { lte: new Date() },
      teamCategory: { discordChannel: { not: null } },
    },
    include: {
      teamCategory: true,
      assignedTo: { include: { profile: true } },
    },
  });
}

export function startReminderCron() {
  schedule("* * * * *", async () => {
    try {
      const tasks = await fetchDueTasks();
      if (tasks.length === 0) return;

      // Mark as sent before sending — prevents duplicates if the bot restarts mid-run.
      // The `reminderSentAt: null` guard makes this atomic: if two instances ran in
      // parallel, only one would get count > 0.
      const { count } = await prisma.teamTask.updateMany({
        where: { id: { in: tasks.map((t) => t.id) }, reminderSentAt: null },
        data: { reminderSentAt: new Date() },
      });

      if (count === 0) return;

      const byChannel = Map.groupBy(tasks, (t) => t.teamCategory!.discordChannel!);

      for (const [channelId, channelTasks] of byChannel) {
        const channel = await client.channels.fetch(channelId).catch(() => null);
        if (!channel || !(channel instanceof TextChannel)) continue;

        const lines = channelTasks.map((task) => {
          const deadline = task.date.toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });
          const assignee = task.assignedTo?.profile.name ?? "Unassigned";
          return `• **${task.title}** — due ${deadline} (${assignee})`;
        });

        await channel.send(`⏰ **Upcoming tasks:**\n${lines.join("\n")}`);
      }
    } catch (error) {
      console.error(error);
    }
  });
}
