import "dotenv/config";
import { Events } from "discord.js";
import { client } from "./lib/client";
import { loadCommands } from "./lib/commands";
import { onReady } from "./events/ready";
import { registerInteractionCreate } from "./events/interactionCreate";
import { startReminderCron } from "./cron/reminders";

loadCommands();
registerInteractionCreate();

client.once(Events.ClientReady, onReady);
startReminderCron();

client.login(process.env.DISCORD_TOKEN);
