import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, Message } from 'discord.js';
import { EconomyService } from '../../services/economy/EconomyService.js';
import { ZeroTwoEmbed } from '../../utils/embeds.js';
import { Emojis } from '../../utils/emojis.js';

export default {
  data: new SlashCommandBuilder()
    .setName('setvip')
    .setDescription('Define o nível VIP de um membro (Staff).')
    .addUserOption(opt => opt.setName('usuario').setDescription('O membro').setRequired(true))
    .addIntegerOption(opt => opt.setName('nivel').setDescription('Nível VIP (0-5)').setRequired(true).setMinValue(0).setMaxValue(5))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction: ChatInputCommandInteraction) {
    const target = interaction.options.getUser('usuario', true);
    const level = interaction.options.getInteger('nivel', true);

    await EconomyService.setVipLevel(target.id, interaction.guildId!, level);

    const embed = ZeroTwoEmbed.success('VIP Atualizado', `O nível VIP de **${target.tag}** foi definido para **${level}**.`)
      .addFields({ name: '🛡️ Moderador', value: interaction.user.tag });

    await interaction.editReply({ embeds: [embed] });
  },

  async executeText(message: Message, args: string[]) {
    if (!message.member?.permissions.has(PermissionFlagsBits.Administrator)) return;

    const target = message.mentions.users.first() || (args[0] ? await message.client.users.fetch(args[0]).catch(() => null) : null);
    const level = parseInt(args[1]);

    if (!target || isNaN(level)) {
      return message.reply({ content: 'Uso: `zero!setvip @usuario [0-5]`' });
    }

    await EconomyService.setVipLevel(target.id, message.guildId!, level);
    await message.reply({ content: `${Emojis.check} VIP de **${target.tag}** definido para nível **${level}**!` });
  }
};
