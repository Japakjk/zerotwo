import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js';
import { UserModel } from '../../database/models/User.js';
import { ZeroTwoEmbed } from '../../utils/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('setvip')
    .setDescription('Define o nível VIP de um Darling.')
    .addUserOption(opt => opt.setName('usuario').setDescription('O Darling a ser promovido.').setRequired(true))
    .addIntegerOption(opt => opt.setName('nivel').setDescription('Nível VIP (0-5)').setRequired(true).setMinValue(0).setMaxValue(5))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction: ChatInputCommandInteraction) {
    const target = interaction.options.getUser('usuario')!;
    const level = interaction.options.getInteger('nivel')!;
    const guildId = interaction.guildId!;

    await UserModel.findOneAndUpdate(
      { userId: target.id, guildId },
      { vipLevel: level },
      { upsert: true }
    );

    const embed = ZeroTwoEmbed.success(
      'Promoção VIP',
      `O Darling **${target.username}** agora é **VIP Nível ${level}**!\nMultiplicadores de coins e redução de cooldown aplicados. 🦖🌸✨`
    );

    await interaction.editReply({ embeds: [embed] });
  },
};
