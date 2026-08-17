import { SlashCommandBuilder, ChatInputCommandInteraction, Message } from 'discord.js';
import { ZeroTwoEmbed } from '../../utils/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('banner')
    .setDescription('Veja o banner de um Darling.')
    .addUserOption(opt => opt.setName('usuario').setDescription('De quem você quer ver o banner?').setRequired(false)),
  async execute(interaction: ChatInputCommandInteraction) {
    const user = await interaction.options.getUser('usuario')?.fetch() || await interaction.user.fetch();
    if (!user.bannerURL()) return interaction.editReply({ content: 'Este Darling não possui um banner.' });
    
    const embed = new ZeroTwoEmbed()
      .setTitle(`🖼️ Banner de ${user.username}`)
      .setImage(user.bannerURL({ size: 1024 })!);
    await interaction.editReply({ embeds: [embed] });
  },

  async executeText(message: Message) {
    const user = await (message.mentions.users.first() || message.author).fetch();
    if (!user.bannerURL()) return message.reply({ content: 'Este Darling não possui um banner.' });

    const embed = new ZeroTwoEmbed()
      .setTitle(`🖼️ Banner de ${user.username}`)
      .setImage(user.bannerURL({ size: 1024 })!);
    await message.reply({ embeds: [embed] });
  },
};
