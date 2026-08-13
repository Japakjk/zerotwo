import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
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
      .setThumbnail(interaction.client.user.displayAvatarURL())
      .setFooter({ text: 'Sistema de Verificação - Darling in the Franxx' })
      .setTimestamp();

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`verify_btn_${role.id}`)
        .setLabel('Verificar-se')
        .setStyle(ButtonStyle.Success)
        .setEmoji('✅')
    );

    await interaction.reply({ embeds: [embed], components: [row] });
  }
};
