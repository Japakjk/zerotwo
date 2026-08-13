import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, EmbedBuilder, TextChannel } from 'discord.js';
import { Emojis } from '../../utils/emojis.js';

export default {
  data: new SlashCommandBuilder()
    .setName('webhook')
    .setDescription('Crie e gerencie webhooks no canal atual')
    .addStringOption(option =>
      option.setName('nome')
        .setDescription('Nome do Webhook')
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageWebhooks),

  async execute(interaction: ChatInputCommandInteraction) {
    const name = interaction.options.getString('nome', true);
    const channel = interaction.channel as TextChannel;

    if (!channel || channel.isDMBased()) {
      return interaction.reply({ content: `${Emojis.warning} **Darling**, este comando só pode ser usado em canais de texto!`, ephemeral: true });
    }

    const webhook = await channel.createWebhook({
      name,
      avatar: 'https://i.imgur.com/2Yj49z.png',
      reason: `Criado por ${interaction.user.tag} via comando Zero Two`
    });

    const embed = new EmbedBuilder()
      .setColor(0xff3b69)
      .setTitle(`${Emojis.cat_moderacao} **Webhook Criado com Sucesso**`)
      .setDescription(`O webhook **${name}** foi criado neste canal!\n\n🔗 **URL:** \`${webhook.url}\``)
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
