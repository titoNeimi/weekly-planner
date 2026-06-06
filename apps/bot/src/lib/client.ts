import {
  Client,
  Collection,
  GatewayIntentBits,
  ChatInputCommandInteraction,
} from "discord.js";

export interface Command {
  data: { name: string; toJSON(): object };
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}

declare module "discord.js" {
  interface Client {
    commands: Collection<string, Command>;
  }
}

export const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();
