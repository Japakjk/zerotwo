import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { ZeroTwoEmbed } from '../../utils/embeds.js';
import { CooldownService } from '../../services/economy/CooldownService.js';
import { Emojis } from '../../utils/emojis.js';
import ms from 'ms';

export default {
  data: new SlashCommandBuilder()
    .setName('cooldowns')
    .setDescription('Confira o status dos seus cooldowns no Garden.'),
  async execute(interaction: ChatInputCommandInteraction) {
    const userId = interaction.user.id;
    const guildId = interaction.guildId!;

    const commandsToCheck = ['daily', 'semanal', 'mensal', 'work', 'beijar', 'abracar', 'cafune', 'socar', 'tapa', 'rep'];
    const results: Record<string, string> = {};

    for (const cmd of commandsToCheck) {
      const cooldown = await CooldownService.checkCooldown(userId, guildId, cmd);
      if (cooldown.inCooldown) {
        results[cmd] = `em **${ms(cooldown.remaining * 1000, { long: true })}**`;
      } else {
        results[cmd] = `${Emojis.check} **Disponível.**`;
      }
    }

    const embed = new ZeroTwoEmbed()
      .setTitle(`${Emojis.clock} Cooldown's de ${interaction.user.username}`)
      .setDescription(`Confira os **cooldown's** abaixo:`)
      .addFields(
        { name: '⏰ Diário', value: `${results.daily}`, inline: true },
        { name: '⏰ Semanal', value: `${results.semanal}`, inline: true },
        { name: '⏰ Mensal', value: `${results.mensal}`, inline: true },
        { name: '⏰ Work', value: `${results.work}`, inline: true },
        { name: '⏰ Beijar', value: `${results.beijar}`, inline: true },
        { name: '⏰ Abraçar', value: `${results.abracar}`, inline: true },
        { name: '⏰ Cafuné', value: `${results.cafune}`, inline: true },
        { name: '⏰ Socar', value: `${results.socar}`, inline: true },
        { name: '⏰ Tapa', value: `${results.tapa}`, inline: true },
        { name: '⏰ Rep', value: `${results.rep}`, inline: true },
      )
      .setFooter({ text: `O tempo passa devagar, não é? ⏳` });

    await interaction.editReply({ embeds: [embed] });
  },
};
