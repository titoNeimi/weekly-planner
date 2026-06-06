import path from "path";
import { readdirSync } from "fs";
import { client } from "./client";

export function loadCommands() {
  const commandsPath = path.join(__dirname, "../commands");
  const files = readdirSync(commandsPath).filter(
    (f) => (f.endsWith(".ts") || f.endsWith(".js")) && !f.endsWith(".d.ts"),
  );

  for (const file of files) {
    const command = require(path.join(commandsPath, file));
    if ("data" in command && "execute" in command) {
      client.commands.set(command.data.name, command);
    } else {
      console.warn(`[WARNING] ${file} is missing "data" or "execute".`);
    }
  }
}
