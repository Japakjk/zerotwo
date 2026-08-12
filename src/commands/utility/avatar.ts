import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { ZeroTwoEmbed } from '../../utils/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('avatar')
    .setDescription('Veja o avatar de um Darling.')
    .addUserOption(opt => opt.setName('usuario').setDescription('De quem você quer ver o avatar?').setRequired(false)),
  async execute(interaction: ChatInputCommandInteraction) {
    const user = interaction.options.getUser('usuario') || interaction.user;
    const embed = new ZeroTwoEmbed()
      .setTitle(`🖼️ Avatar de ${user.username}`)
      .setImage(user.displayAvatarURL({ size: 1024 }));
    await interaction.editReply({ embeds: [embed] });
  },
};
