import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { RelationshipService } from '../../services/social/RelationshipService.js';
import { ZeroTwoEmbed } from '../../utils/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('namorar')
    .setDescription('Peça um Darling em namoro.')
    .addUserOption(opt => opt.setName('usuario').setDescription('Quem você quer pedir em namoro?').setRequired(true)),
  async execute(interaction: ChatInputCommandInteraction) {
    const target = interaction.options.getUser('usuario')!;
    const result = await RelationshipService.propose(interaction.user.id, target.id, interaction.guildId!);

    if (!result.success) {
      return interaction.editReply({ content: result.message });
    }

    const embed = new ZeroTwoEmbed()
      .setTitle('❤️ Um Novo Pedido de União!')
      .setDescription(`**${interaction.user.username}** pediu **${target.username}** em namoro!\n\n"Você quer ser meu Darling?"\n\nUse \/aceitar para dizer SIM ou \/recusar para dizer NÃO.`)
      .setThumbnail('https://i.imgur.com/4M1q3zs.png');

    await interaction.editReply({ content: `<@${target.id}>`, embeds: [embed] });
  },
};
