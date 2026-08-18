import type { ChatInputCommandInteraction, Message, SlashCommandBuilder, SlashCommandSubcommandsOnlyBuilder, SlashCommandOptionsOnlyBuilder } from 'discord.js';

export type CommandData = SlashCommandBuilder | SlashCommandSubcommandsOnlyBuilder | SlashCommandOptionsOnlyBuilder;

export interface CommandDefinition {
  data: CommandData;
  execute: (interaction: ChatInputCommandInteraction) => Promise<unknown>;
  executeText?: (message: Message, args: string[]) => Promise<unknown>;
}
