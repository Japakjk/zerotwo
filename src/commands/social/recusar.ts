import { SlashCommandBuilder, ChatInputCommandInteraction, Message } from 'discord.js';
import { RelationshipService } from '../../services/social/RelationshipService.js';
import { ZeroTwoEmbed } from '../../utils/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('recusar')
    .setDescription('Recuse um pedido de namoro pendente.'),
  async execute(interaction: ChatInputCommandInteraction) {
    await this.decline(interaction.user.id, interaction.guildId!, (payload: any) => interaction.editReply(payload));
  },

  async executeText(message: Message) {
    await this.decline(message.author.id, message.guild!.id, (payload: any) => message.reply(payload));
  },

  async decline(userId: string, guildId: string, send: (payload: any) => Promise<unknown>) {
    const success = await RelationshipService.decline(userId, guildId);

    if (!success) {
      return send({ content: 'Não há pedidos para recusar.' });
    }

    await send({ content: 'Pedido recusado. O Garden continua o mesmo...' });
  },
};
