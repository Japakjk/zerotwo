import { SlashCommandBuilder, ChatInputCommandInteraction, Message } from 'discord.js';
import { SocialService } from '../../services/social/SocialService.js';
import { CooldownService } from '../../services/economy/CooldownService.js';
import { ZeroTwoEmbed } from '../../utils/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('olhar')
    .setDescription('Olhe fixamente para um Darling.')
    .addUserOption(opt => opt.setName('usuario').setDescription('O Darling que você está observando').setRequired(true)),

  async execute(interaction: ChatInputCommandInteraction) {
    const target = interaction.options.getUser('usuario', true);
    if (target.id === interaction.user.id) return interaction.editReply({ content: 'Você não pode olhar para si mesmo desse jeito, Darling! 🦖🌸' });

    const cooldown = await CooldownService.checkCooldown(interaction.user.id, interaction.guildId!, 'olhar');
    if (cooldown.inCooldown) {
      return interaction.editReply({ 
        embeds: [ZeroTwoEmbed.error('Calma, Darling!', `Você precisa esperar **${cooldown.remainingFormatted}** para interagir novamente!`)] 
      });
    }

    const embed = await SocialService.executeInteraction(
      'olhar',
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
    if (!target) return message.reply({ content: 'Você precisa mencionar um Darling!' });
    if (target.id === message.author.id) return message.reply({ content: 'Você não pode olhar para si mesmo desse jeito, Darling! 🦖🌸' });

    const cooldown = await CooldownService.checkCooldown(message.author.id, message.guildId!, 'olhar');
    if (cooldown.inCooldown) {
      return message.reply({ 
        embeds: [ZeroTwoEmbed.error('Calma, Darling!', `Você precisa esperar **${cooldown.remainingFormatted}** para interagir novamente!`)] 
      });
    }

    const embed = await SocialService.executeInteraction(
      'olhar',
      message.author.id, 
      target.id, 
      message.author.username, 
      target.username, 
      message.guildId!
    );
    
    await message.reply({ content: `<@${target.id}>`, embeds: [embed] });
  }
};
