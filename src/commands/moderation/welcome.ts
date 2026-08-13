import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, EmbedBuilder, ChannelType } from 'discord.js';
import { GuildModel } from '../../database/models/Guild.js';
import { Emojis } from '../../utils/emojis.js';

export default {
  data: new SlashCommandBuilder()
    .setName('welcome')
    .setDescription('Configure o canal de boas-vindas do servidor')
    .addChannelOption(option =>
      option.setName('canal')
        .setDescription('Canal onde as boas-vindas serão enviadas')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction: ChatInputCommandInteraction) {
    const channel = interaction.options.getChannel('canal', true) as any;
    const guildId = interaction.guildId!;

    let guildData = await GuildModel.findOne({ guildId });
    if (!guildData) {
      guildData = new GuildModel({ guildId });
    }

    guildData.welcomeChannelId = channel.id;
    await guildData.save();

    const embed = new EmbedBuilder()
      .setColor(0xff3b69)
      .setTitle(`${Emojis.check} **Canal de Boas-Vindas Configurado**`)
      .setDescription(`As mensagens de boas-vindas da **Zero Two** serão enviadas em ${channel}!\n\n*Variáveis suportadas: \`{user}\`, \`{username}\`, \`{server}\`*`)
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
