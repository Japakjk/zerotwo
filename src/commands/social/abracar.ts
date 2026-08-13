import { SlashCommandBuilder, ChatInputCommandInteraction, Message } from 'discord.js';
import { SocialService } from '../../services/social/SocialService.js';
import { CooldownService } from '../../services/economy/CooldownService.js';
import { ZeroTwoEmbed } from '../../utils/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('abracar')
    .setDescription('Envolve um Darling em um abraço protetor.')
    .addUserOption(opt => opt.setName('usuario').setDescription('O Darling que você quer abraçar').setRequired(true)),

  async execute(interaction: ChatInputCommandInteraction) {
    const target = interaction.options.getUser('usuario', true);
    if (target.id === interaction.user.id) return interaction.editReply({ content: 'Você não pode se abraçar sozinho, Darling! 🦖🌸' });

    const cooldown = await CooldownService.checkCooldown(interaction.user.id, interaction.guildId!, 'abracar');
    if (cooldown.inCooldown) {
      return interaction.editReply({ 
        embeds: [ZeroTwoEmbed.error('Calma, Darling!', `Você precisa esperar **${cooldown.remainingFormatted}** para abraçar alguém novamente!`)] 
      });
    }

    const embed = await SocialService.executeInteraction(
      'abracar', 
      interaction.user.id, 
      target.id, 
      interaction.user.username, 
      target.username, 
      interaction.guildId!
    );
    
    await interaction.editReply({ content: `<@${target.id}>`, embeds: [embed] });
  },

  async executeText(message: Message, args: string[]) {
    const target = message.mentions.users.first() || (args[0] ? await message.client.users.fetch(args[0]).catch(() => null) : null);
    if (!target) return message.reply({ content: 'Você precisa mencionar um Darling para abraçar!' });
    if (target.id === message.author.id) return message.reply({ content: 'Você não pode se abraçar sozinho, Darling! 🦖🌸' });

    const cooldown = await CooldownService.checkCooldown(message.author.id, message.guildId!, 'abracar');
    if (cooldown.inCooldown) {
      return message.reply({ 
        embeds: [ZeroTwoEmbed.error('Calma, Darling!', `Você precisa esperar **${cooldown.remainingFormatted}** para abraçar alguém novamente!`)] 
      });
    }

    const embed = await SocialService.executeInteraction(
      'abracar', 
      message.author.id, 
      target.id, 
      message.author.username, 
      target.username, 
      message.guildId!
    );
    
    await message.reply({ content: `<@${target.id}>`, embeds: [embed] });
  }
};
