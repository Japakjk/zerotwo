import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { ProfileService } from '../../services/profile/ProfileService.js';
import { Emojis } from '../../utils/emojis.js';

export default {
  data: new SlashCommandBuilder()
    .setName('bio')
    .setDescription('Defina sua biografia personalizada no perfil da Zero Two')
    .addStringOption(option =>
      option.setName('texto')
        .setDescription('O texto da sua bio (máximo de 150 caracteres)')
        .setMaxLength(150)
        .setRequired(true)),

  async execute(interaction: ChatInputCommandInteraction) {
    const texto = interaction.options.getString('texto', true);
    const userId = interaction.user.id;
    const guildId = interaction.guildId!;

    await ProfileService.updateBio(userId, guildId, texto);

    const embed = new EmbedBuilder()
      .setColor(0xff3b69)
      .setTitle(`${Emojis.check} **Biografia Atualizada**`)
      .setDescription(`Sua bio foi alterada com sucesso, **Darling**!\n\n> *"${texto}"*`)
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
