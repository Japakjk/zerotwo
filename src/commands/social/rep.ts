import { SlashCommandBuilder, ChatInputCommandInteraction, Message } from 'discord.js';
import { ReputationService } from '../../services/social/ReputationService.js';
import { ZeroTwoEmbed } from '../../utils/embeds.js';
import ms from 'ms';

export default {
  data: new SlashCommandBuilder()
    .setName('rep')
    .setDescription('Dê um ponto de reputação para um Darling exemplar.')
    .addUserOption(opt => opt.setName('usuario').setDescription('Quem merece sua reputação?').setRequired(true)),
  async execute(interaction: ChatInputCommandInteraction) {
    const target = interaction.options.getUser('usuario')!;
    await this.give(interaction.user.id, target, interaction.guildId!, (payload: any) => interaction.editReply(payload));
  },

  async executeText(message: Message) {
    const target = message.mentions.users.first();
    if (!target) return message.reply({ content: 'Mencione quem merece reputação. Exemplo: `zero!rep @usuario`' });
    await this.give(message.author.id, target, message.guild!.id, (payload: any) => message.reply(payload));
  },

  async give(userId: string, target: { id: string; username: string }, guildId: string, send: (payload: any) => Promise<unknown>) {
    const result = await ReputationService.giveRep(userId, target.id, guildId);

    if (!result.success) {
      if (result.nextAvailable) {
        return send({ content: `Você já deu rep recentemente! Volte em **${ms(result.nextAvailable - Date.now(), { long: true })}**` });
      }
      return send({ content: result.message });
    }

    const embed = ZeroTwoEmbed.success('Reputação Enviada', `Você deu +1 de reputação para **${target.username}**. A Zero Two valoriza bons companheiros! 🦖🌸`);
    await send({ embeds: [embed] });
  },
};
