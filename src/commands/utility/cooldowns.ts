import { SlashCommandBuilder, ChatInputCommandInteraction, Message } from 'discord.js';
import { ZeroTwoEmbed } from '../../utils/embeds.js';
import { CooldownService } from '../../services/economy/CooldownService.js';
import { Emojis } from '../../utils/emojis.js';
import ms from 'ms';

export default {
  data: new SlashCommandBuilder()
    .setName('cooldowns')
    .setDescription('Confira o status dos seus cooldowns no Garden.'),
  async execute(interaction: ChatInputCommandInteraction) {
    await this.sendCooldowns(interaction.user.id, interaction.guildId!, interaction.user.username, (payload: any) => interaction.editReply(payload));
  },

  async executeText(message: Message) {
    await this.sendCooldowns(message.author.id, message.guild!.id, message.author.username, (payload: any) => message.reply(payload));
  },

  async sendCooldowns(userId: string, guildId: string, username: string, send: (payload: any) => Promise<unknown>) {
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
      .setTitle(`${Emojis.clock} Cooldown's de ${username}`)
      .setDescription(`${Emojis.seta} Confira os **cooldown's** abaixo, **Darling**:`)
      .addFields(
        { name: `${Emojis.clock} Diário`, value: `${results.daily}`, inline: true },
        { name: `${Emojis.clock} Semanal`, value: `${results.semanal}`, inline: true },
        { name: `${Emojis.clock} Mensal`, value: `${results.mensal}`, inline: true },
        { name: `${Emojis.clock} Work`, value: `${results.work}`, inline: true },
        { name: `${Emojis.clock} Beijar`, value: `${results.beijar}`, inline: true },
        { name: `${Emojis.clock} Abraçar`, value: `${results.abracar}`, inline: true },
        { name: `${Emojis.clock} Cafuné`, value: `${results.cafune}`, inline: true },
        { name: `${Emojis.clock} Socar`, value: `${results.socar}`, inline: true },
        { name: `${Emojis.clock} Tapa`, value: `${results.tapa}`, inline: true },
        { name: `${Emojis.clock} Rep`, value: `${results.rep}`, inline: true },
      )
      .setFooter({ text: `O tempo passa devagar, não é?` });

    await send({ embeds: [embed] });
  },
};
