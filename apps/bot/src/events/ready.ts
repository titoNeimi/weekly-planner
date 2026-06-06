import { Client } from "discord.js";

export function onReady(client: Client<true>) {
  console.log(`Ready! Logged in as ${client.user.tag}`);
}
