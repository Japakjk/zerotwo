import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, Message } from 'discord.js';
import { Emojis } from '../../utils/emojis.js';

export default {
  data: new SlashCommandBuilder()
    .setName('verificação')
    .setDescription('Crie o painel de verificação de membros do Garden')
    .addRoleOption(option =>
      option.setName('cargo')
        .setDescription('Cargo concedido após a verificação')
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction: ChatInputCommandInteraction) {
    const role = interaction.options.getRole('cargo', true);

    const embed = new EmbedBuilder()
      .setColor(0xff3b69)
      .setTitle(`${Emojis.achievement} **Verificação do Garden | Zero Two**`)
      .setDescription(
        `Olá **Darling**! Para ter acesso completo ao servidor, você precisa se verificar.\n\n` +
        `Clique no botão abaixo para provar que você é um piloto digno da Strelizia e receber o cargo **${role.name}**!`
      )
      .setThumbnail(interaction.client.user?.displayAvatarURL() || null)
      .setFooter({ text: 'Sistema de Verificação - Darling in the Franxx' })
      .setTimestamp();

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`verify_btn_${role.id}`)
        .setLabel('Verificar-se')
        .setStyle(ButtonStyle.Success)
        .setEmoji('✅')
    );

    await interaction.editReply({ embeds: [embed], components: [row] });
  },

  async executeText(message: Message, args: string[]) {
    if (!message.member?.permissions.has(PermissionFlagsBits.Administrator)) {
      return message.reply({ content: `${Emojis.warning} Você precisa ser **Administrador** para criar o painel de verificação, Darling!` });
    }

    const roleMention = message.mentions.roles.first() || (args[0] ? message.guild?.roles.cache.get(args[0].replace(/<@&|>/g, '')) : null);
    if (!roleMention) {
      return message.reply({ content: `Uso correto: \`zero!verificação @cargo\`, Darling!` });
    }

    const embed = new EmbedBuilder()
      .setColor(0xff3b69)
      .setTitle(`${Emojis.achievement} **Verificação do Garden | Zero Two**`)
      .setDescription(
        `Olá **Darling**! Para ter acesso completo ao servidor, você precisa se verificar.\n\n` +
        `Clique no botão abaixo para provar que você é um piloto digno da Strelizia e receber o cargo **${roleMention.name}**!`
      )
      .setThumbnail(message.client.user?.displayAvatarURL() || null)
      .setFooter({ text: 'Sistema de Verificação - Darling in the Franxx' })
      .setTimestamp();

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`verify_btn_${roleMention.id}`)
        .setLabel('Verificar-se')
        .setStyle(ButtonStyle.Success)
        .setEmoji('✅')
    );

    await message.reply({ embeds: [embed], components: [row] });
  }
};
