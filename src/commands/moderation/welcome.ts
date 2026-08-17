import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, EmbedBuilder, ChannelType, Message } from 'discord.js';
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

    await interaction.editReply({ embeds: [embed] });
  },

  async executeText(message: Message, args: string[]) {
    if (!message.member?.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return message.reply({ content: `${Emojis.warning} Você precisa ter permissão de **Gerenciar Servidor**, Darling!` });
    }

    const channelMention = message.mentions.channels.first() || (args[0] ? message.guild?.channels.cache.get(args[0].replace(/<#|>/g, '')) : null);
    if (!channelMention || channelMention.type !== ChannelType.GuildText) {
      return message.reply({ content: `Uso correto: \`zero!welcome #canal\`, Darling!` });
    }

    const guildId = message.guildId!;
    let guildData = await GuildModel.findOne({ guildId });
    if (!guildData) {
      guildData = new GuildModel({ guildId });
    }

    guildData.welcomeChannelId = channelMention.id;
    await guildData.save();

    const embed = new EmbedBuilder()
      .setColor(0xff3b69)
      .setTitle(`${Emojis.check} **Canal de Boas-Vindas Configurado**`)
      .setDescription(`As mensagens de boas-vindas da **Zero Two** serão enviadas em ${channelMention}!\n\n*Variáveis suportadas: \`{user}\`, \`{username}\`, \`{server}\`*`)
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  }
};
