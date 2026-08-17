import { SlashCommandBuilder, ChatInputCommandInteraction, Message } from 'discord.js';
import { RelationshipService } from '../../services/social/RelationshipService.js';
import { SocialService } from '../../services/social/SocialService.js';
import { ZeroTwoEmbed } from '../../utils/embeds.js';
import { Emojis } from '../../utils/emojis.js';
import ms from 'ms';

export default {
  data: new SlashCommandBuilder()
    .setName('parceiro')
    .setDescription('Mostra detalhes do seu relacionamento atual.'),
  async execute(interaction: ChatInputCommandInteraction) {
    await this.send(interaction.user.id, interaction.guildId!, (payload: any) => interaction.editReply(payload));
  },

  async executeText(message: Message) {
    await this.send(message.author.id, message.guild!.id, (payload: any) => message.reply(payload));
  },

  async send(userId: string, guildId: string, send: (payload: any) => Promise<unknown>) {
    const rel = await RelationshipService.getRelationship(userId, guildId);

    if (!rel) {
      return send({ content: 'Você está solteiro(a), Darling. Que tal procurar alguém?' });
    }

    const partnerId = rel.user1Id === userId ? rel.user2Id : rel.user1Id;
    const time = Date.now() - rel.startedAt.getTime();
    const affinity = await SocialService.getPairAffinity(userId, partnerId, guildId);

    const embed = new ZeroTwoEmbed()
      .setTitle(`${Emojis.mensagemCoracao} Detalhes da União`)
      .setDescription(
        `Você está em um relacionamento com <@${partnerId}>.\n\n` +
        `${Emojis.cronometro} **Tempo:** ${ms(time, { long: true })}\n` +
        `${Emojis.coracao} **Tipo:** ${rel.type.toUpperCase()}\n` +
        `${Emojis.fogoCoracao} **Afinidade:** ${affinity.toFixed(2)}%`,
      )
      .setThumbnail('https://i.imgur.com/4M1q3zs.png');

    await send({ embeds: [embed] });
  },
};
