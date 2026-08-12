import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { EconomyService } from '../../services/economy/EconomyService.js';
import { ZeroTwoEmbed } from '../../utils/embeds.js';
import { Emojis } from '../../utils/emojis.js';
import ms from 'ms';

export default {
  data: new SlashCommandBuilder()
    .setName('daily')
    .setDescription('Resgate sua recompensa diária de D-Coins!'),
  async execute(interaction: ChatInputCommandInteraction) {
    const result = await EconomyService.claimDaily(interaction.user.id, interaction.guildId!);

    if (!result.success) {
      const remaining = result.nextAvailable! - Date.now();
      return interaction.editReply({
        embeds: [ZeroTwoEmbed.warning('Calma, Darling!', `Você já resgatou seu prêmio hoje. Volte em **${ms(remaining, { long: true })}**!`)]
      });
    }

    const embed = new ZeroTwoEmbed()
      .setTitle(`${Emojis.cat_economia} Recompensa do Dia!`)
      .setDescription(`${Emojis.seta} Você recebeu **${result.amount?.toLocaleString()} ${Emojis.coin}**!\n\n${Emojis.seta_menor} A Zero Two está orgulhosa da sua dedicação.`)
      .addFields({ name: '🔥 Streak', value: 'Você está em uma sequência!', inline: true });

    await interaction.editReply({ embeds: [embed] });
  },
};
