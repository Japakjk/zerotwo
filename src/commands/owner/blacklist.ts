import { SlashCommandBuilder, ChatInputCommandInteraction, Message } from 'discord.js';
import { BlacklistModel } from '../../database/models/Blacklist.js';
import { Emojis } from '../../utils/emojis.js';
import { config } from '../../config/config.js';

const OWNER_IDS = [config.OWNER_ID];

export default {
  data: new SlashCommandBuilder()
    .setName('blacklist')
    .setDescription('Bloqueia ou desbloqueia um usuário de usar o bot.')
    .addUserOption(option => option.setName('usuario').setDescription('Usuário alvo').setRequired(true))
    .addStringOption(option => option.setName('motivo').setDescription('Motivo do bloqueio').setRequired(false)),
  async execute(interaction: ChatInputCommandInteraction) {
    if (!OWNER_IDS.includes(interaction.user.id)) {
      return interaction.editReply({ content: `${Emojis.ban} Apenas o **Owner do Bot** pode gerenciar a blacklist!` });
    }
    const user = interaction.options.getUser('usuario', true);
    const reason = interaction.options.getString('motivo') || 'Violação dos termos';

    const existing = await BlacklistModel.findOne({ userId: user.id });
    if (existing) {
      await BlacklistModel.deleteOne({ userId: user.id });
      return interaction.editReply({ content: `${Emojis.check} O usuário **${user.tag}** foi removido da blacklist com sucesso!` });
    } else {
      await BlacklistModel.create({ userId: user.id, reason, moderatorId: interaction.user.id });
      return interaction.editReply({ content: `${Emojis.ban} O usuário **${user.tag}** foi adicionado à blacklist. Motivo: *${reason}*` });
    }
  },
  async executeText(message: Message, args: string[]) {
    if (!OWNER_IDS.includes(message.author.id)) return message.reply(`${Emojis.ban} Apenas o **Owner do Bot** pode gerenciar a blacklist!`);
    const target = message.mentions.users.first() || (args[0] ? await message.client.users.fetch(args[0]).catch(() => null) : null);
    if (!target) return message.reply('Mencione um usuário para adicionar/remover da blacklist.');
    const userId = typeof target === 'string' ? target : (target as any).id;

    const existing = await BlacklistModel.findOne({ userId });
    if (existing) {
      await BlacklistModel.deleteOne({ userId });
      return message.reply(`${Emojis.check} Usuário <@${userId}> removido da blacklist com sucesso!`);
    } else {
      await BlacklistModel.create({ userId, reason: args.slice(1).join(' ') || 'Violação dos termos', moderatorId: message.author.id });
      return message.reply(`${Emojis.ban} Usuário <@${userId}> adicionado à blacklist.`);
    }
  }
};
