import { SlashCommandBuilder, ChatInputCommandInteraction, Message, PermissionFlagsBits } from 'discord.js';
import { Emojis } from '../../utils/emojis.js';

export default {
  data: new SlashCommandBuilder()
    .setName('dm')
    .setDescription('Envia uma mensagem privada para um usuário (Apenas Admin).')
    .addUserOption(option => option.setName('usuario').setDescription('Usuário alvo').setRequired(true))
    .addStringOption(option => option.setName('mensagem').setDescription('Mensagem a ser enviada').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction: ChatInputCommandInteraction) {
    const user = interaction.options.getUser('usuario', true);
    const msgContent = interaction.options.getString('mensagem', true);

    try {
      await user.send({ content: `🌸 **Mensagem da Administração de ${interaction.guild?.name}:**\n\n${msgContent}` });
      await interaction.editReply({ content: `${Emojis.check} Mensagem enviada com sucesso para **${user.tag}**!` });
    } catch {
      await interaction.editReply({ content: `${Emojis.ban} Não foi possível enviar a DM para ${user.tag} (usuário com DMs fechadas).` });
    }
  },
  async executeText(message: Message, args: string[]) {
    if (!message.member?.permissions.has(PermissionFlagsBits.Administrator)) {
      return message.reply(`${Emojis.ban} Apenas administradores podem usar este comando!`);
    }
    const target = message.mentions.users.first();
    const msgContent = args.slice(1).join(' ');
    if (!target || !msgContent) return message.reply('Uso correto: `zero!dm @usuario [mensagem]`');

    try {
      await target.send({ content: `🌸 **Mensagem da Administração de ${message.guild?.name}:**\n\n${msgContent}` });
      await message.reply(`${Emojis.check} Mensagem enviada com sucesso para **${target.tag}**!`);
    } catch {
      await message.reply(`${Emojis.ban} Não foi possível enviar a DM para ${target.tag}.`);
    }
  }
};
