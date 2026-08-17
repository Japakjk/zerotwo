import { SlashCommandBuilder, ChatInputCommandInteraction, Message } from 'discord.js';
import { FriendshipService } from '../../services/social/FriendshipService.js';
import { ZeroTwoEmbed } from '../../utils/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('aceitar-amizade')
    .setDescription('Aceita um pedido de amizade pendente.')
    .addUserOption(opt => opt.setName('usuario').setDescription('Quem enviou o pedido?').setRequired(true)),
  async execute(interaction: ChatInputCommandInteraction) {
    const target = interaction.options.getUser('usuario')!;
    await this.accept(interaction.user.id, target.id, target.id, interaction.guildId!, (payload: any) => interaction.editReply(payload));
  },

  async executeText(message: Message) {
    const target = message.mentions.users.first();
    if (!target) return message.reply({ content: 'Mencione quem enviou o pedido. Exemplo: `zero!aceitar-amizade @usuario`' });
    await this.accept(message.author.id, target.id, target.id, message.guild!.id, (payload: any) => message.reply(payload));
  },

  async accept(userId: string, targetId: string, displayTargetId: string, guildId: string, send: (payload: any) => Promise<unknown>) {
    const success = await FriendshipService.acceptRequest(userId, targetId, guildId);

    if (!success) return send({ content: 'Não há pedidos de amizade pendentes deste usuário.' });

    const embed = ZeroTwoEmbed.success('Amizade Confirmada', `Agora você e <@${displayTargetId}> são amigos oficiais no Garden! 🌸🤝`);
    await send({ embeds: [embed] });
  },
};
