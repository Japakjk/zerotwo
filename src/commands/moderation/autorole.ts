import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, EmbedBuilder, Message } from 'discord.js';
import { GuildModel } from '../../database/models/Guild.js';
import { Emojis } from '../../utils/emojis.js';

export default {
  data: new SlashCommandBuilder()
    .setName('autorole')
    .setDescription('Configure o cargo automático para novos membros no Garden')
    .addRoleOption(option =>
      option.setName('cargo')
        .setDescription('Cargo que será entregue automaticamente')
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction: ChatInputCommandInteraction) {
    const role = interaction.options.getRole('cargo', true);
    const guildId = interaction.guildId!;

    let guildData = await GuildModel.findOne({ guildId });
    if (!guildData) {
      guildData = new GuildModel({ guildId });
    }

    guildData.autoRoleId = role.id;
    await guildData.save();

    const embed = new EmbedBuilder()
      .setColor(0xff3b69)
      .setTitle(`${Emojis.check} **Cargo Automático Configurado**`)
      .setDescription(`Agora, quando novos Darlings entrarem no servidor, eles receberão automaticamente o cargo **${role.name}**!`)
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  },

  async executeText(message: Message, args: string[]) {
    if (!message.member?.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return message.reply({ content: `${Emojis.warning} Você precisa ter permissão de **Gerenciar Servidor**, Darling!` });
    }

    const roleMention = message.mentions.roles.first() || (args[0] ? message.guild?.roles.cache.get(args[0].replace(/<@&|>/g, '')) : null);
    if (!roleMention) {
      return message.reply({ content: `Uso correto: \`zero!autorole @cargo\`, Darling!` });
    }

    const guildId = message.guildId!;
    let guildData = await GuildModel.findOne({ guildId });
    if (!guildData) {
      guildData = new GuildModel({ guildId });
    }

    guildData.autoRoleId = roleMention.id;
    await guildData.save();

    const embed = new EmbedBuilder()
      .setColor(0xff3b69)
      .setTitle(`${Emojis.check} **Cargo Automático Configurado**`)
      .setDescription(`Agora, quando novos Darlings entrarem no servidor, eles receberão automaticamente o cargo **${roleMention.name}**!`)
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  }
};
