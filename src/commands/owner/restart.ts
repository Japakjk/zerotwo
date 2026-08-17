import { SlashCommandBuilder, ChatInputCommandInteraction, Message } from 'discord.js';
import { Emojis } from '../../utils/emojis.js';
import { config } from '../../config/config.js';

const OWNER_IDS = [config.OWNER_ID];

export default {
  data: new SlashCommandBuilder()
    .setName('restart')
    .setDescription('Reinicia o bot (Apenas para o Owner do Bot).'),
  async execute(interaction: ChatInputCommandInteraction) {
    if (!OWNER_IDS.includes(interaction.user.id)) {
      return interaction.editReply({ content: `${Emojis.ban} Apenas o **Owner do Bot** pode usar este comando!` });
    }
    await interaction.editReply({ content: `${Emojis.check} Reiniciando o bot, Darling... 🦖🌸` });
    process.exit(0);
  },
  async executeText(message: Message) {
    if (!OWNER_IDS.includes(message.author.id)) return message.reply(`${Emojis.ban} Apenas o **Owner do Bot** pode usar este comando!`);
    await message.reply(`${Emojis.check} Reiniciando o bot, Darling... 🦖🌸`);
    process.exit(0);
  }
};
