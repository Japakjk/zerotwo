import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, Message } from 'discord.js';
import clear from './clear.js';

const clearCommand = clear as any;

export default {
  data: new SlashCommandBuilder()
    .setName('purge')
    .setDescription('Limpa mensagens do canal atual (alias de /clear).')
    .addIntegerOption(opt => opt.setName('quantidade').setDescription('Número de mensagens (1-100)').setRequired(true).setMinValue(1).setMaxValue(100))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  // O alias reutiliza a implementação auditada de clear, incluindo validações e confirmação.
  async execute(interaction: ChatInputCommandInteraction) {
    return clearCommand.execute.call(this, interaction);
  },
  async executeText(message: Message, args: string[]) {
    return clearCommand.executeText.call(this, message, args);
  },
  performClear: clearCommand.performClear
};
