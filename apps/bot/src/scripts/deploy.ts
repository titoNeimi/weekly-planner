import "dotenv/config";
import { REST, Routes } from "discord.js";
import path from "path";
import { readdirSync } from "fs";

const token = process.env.DISCORD_TOKEN!;
const clientId = process.env.DISCORD_CLIENT_ID!;
const guildId = process.env.DISCORD_GUILD_ID;

const commandsPath = path.join(__dirname, "../commands");
const files = readdirSync(commandsPath).filter(
  (f) => (f.endsWith(".ts") || f.endsWith(".js")) && !f.endsWith(".d.ts"),
);

const commands = files.flatMap((file) => {
  const command = require(path.join(commandsPath, file));
  return "data" in command ? [command.data.toJSON()] : [];
});

const rest = new REST().setToken(token);
const route = guildId
  ? Routes.applicationGuildCommands(clientId, guildId)
  : Routes.applicationCommands(clientId);

(async () => {
  console.log(`Deploying ${commands.length} command(s)...`);
  await rest.put(route, { body: commands });
  console.log(
    guildId ? `Done. Deployed to guild ${guildId}.` : "Done. Global commands deployed (up to 1h to propagate).",
  );
})();
