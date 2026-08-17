import { SlashCommandBuilder, ChatInputCommandInteraction, Message } from 'discord.js';
import { ReputationService } from '../../services/social/ReputationService.js';
import { ZeroTwoEmbed } from '../../utils/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('toprep')
    .setDescription('Mostra os Darlings com mais reputação no Garden.'),
  async execute(interaction: ChatInputCommandInteraction) {
    await this.send(interaction.guildId!, (payload: any) => interaction.editReply(payload));
  },

  async executeText(message: Message) {
    await this.send(message.guild!.id, (payload: any) => message.reply(payload));
  },

  async send(guildId: string, send: (payload: any) => Promise<unknown>) {
    const top = await ReputationService.getTopRep(guildId);
    if (top.length === 0) return send({ content: 'Ninguém tem reputação ainda, Darling.' });

    const list = top.map((u: any, i: number) => `**${i + 1}.** <@${u.userId}> — **${u.reputation}** reps`).join('\n');
    const embed = new ZeroTwoEmbed().setTitle('⭐ Darlings mais Populares').setDescription(list);
    await send({ embeds: [embed] });
  },
};
