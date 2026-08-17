import { SlashCommandBuilder, ChatInputCommandInteraction, Message } from 'discord.js';
import { RelationshipService } from '../../services/social/RelationshipService.js';
import { ZeroTwoEmbed } from '../../utils/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('aceitar')
    .setDescription('Aceite um pedido de namoro pendente.'),
  async execute(interaction: ChatInputCommandInteraction) {
    await this.accept(interaction.user.id, interaction.guildId!, (payload: any) => interaction.editReply(payload));
  },

  async executeText(message: Message) {
    await this.accept(message.author.id, message.guild!.id, (payload: any) => message.reply(payload));
  },

  async accept(userId: string, guildId: string, send: (payload: any) => Promise<unknown>) {
    const result = await RelationshipService.accept(userId, guildId);

    if (!result.success) {
      return send({ content: 'Você não tem nenhum pedido pendente, Darling.' });
    }

    const embed = ZeroTwoEmbed.success('União Confirmada!', `Parabéns! Agora você e <@${result.partnerId}> são parceiros oficiais no Garden. 🦖❤️💍`);
    await send({ embeds: [embed] });
  },
};
