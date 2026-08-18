import { SlashCommandBuilder, ChatInputCommandInteraction, Message } from 'discord.js';
import { RelationshipService } from '../../services/social/RelationshipService.js';
import { ZeroTwoEmbed } from '../../utils/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('divorciar')
    .setDescription('Termine seu relacionamento atual.'),
  async execute(interaction: ChatInputCommandInteraction) {
    await this.breakUp(interaction.user.id, interaction.guildId!, (payload: any) => interaction.editReply(payload));
  },

  async executeText(message: Message) {
    await this.breakUp(message.author.id, message.guild!.id, (payload: any) => message.reply(payload));
  },

  async breakUp(userId: string, guildId: string, send: (payload: any) => Promise<unknown>) {
    const success = await RelationshipService.breakUp(userId, guildId);

    if (!success) {
      return send({ content: 'Você não está em um relacionamento para terminar.' });
    }

    const embed = ZeroTwoEmbed.warning('Relacionamento Encerrado', 'O vínculo foi quebrado. Vocês agora seguem caminhos diferentes no Garden.');
    await send({ embeds: [embed] });
  },
};
