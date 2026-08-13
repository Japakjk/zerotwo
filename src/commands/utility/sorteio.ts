import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import { Emojis } from '../../utils/emojis.js';

export default {
  data: new SlashCommandBuilder()
    .setName('sorteio')
    .setDescription('Crie um sorteio incrível no servidor com a Zero Two!')
    .addStringOption(option =>
      option.setName('premio')
        .setDescription('O prêmio que será sorteado')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('tempo')
        .setDescription('Duração do sorteio (ex: 1h, 30m, 1d)')
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction: ChatInputCommandInteraction) {
    const premio = interaction.options.getString('premio', true);
    const tempo = interaction.options.getString('tempo', true);

    const embed = new EmbedBuilder()
      .setColor(0xff3b69)
      .setTitle(`${Emojis.achievement} **SORTEIO DA ZERO TWO** ${Emojis.achievement}`)
      .setDescription(`Olá **Darling**! Um novo sorteio acaba de começar no servidor!\n\n🎁 **Prêmio:** \`${premio}\`\n⏳ **Duração:** \`${tempo}\`\n👤 **Organizado por:** ${interaction.user}\n\nReaja com ${Emojis.check} para participar deste sorteio especial!`)
      .setFooter({ text: 'Darling in the Franxx - Sorteios' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
    const reply = await interaction.fetchReply();
    await reply.react('✅');
  }
};
