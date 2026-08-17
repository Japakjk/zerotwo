import { SlashCommandBuilder, ChatInputCommandInteraction, Message } from 'discord.js';
import { SocialService } from '../../services/social/SocialService.js';
import { CooldownService } from '../../services/economy/CooldownService.js';
import { ZeroTwoEmbed } from '../../utils/embeds.js';
import { Emojis } from '../../utils/emojis.js';

export default {
  data: new SlashCommandBuilder()
    .setName('beijar')
    .setDescription('Dê um beijo apaixonado em um Darling.')
    .addUserOption(opt => opt.setName('usuario').setDescription('O Darling que você quer beijar').setRequired(true)),

  async execute(interaction: ChatInputCommandInteraction) {
    const target = interaction.options.getUser('usuario', true);
    await this.handleInteraction(interaction, interaction.user, target, interaction.guildId!);
  },

  async executeText(message: Message, args: string[]) {
    const target = message.mentions.users.first() || (args[0] ? await message.client.users.fetch(args[0]).catch(() => null) : null);
    if (!target) return message.reply({ content: `${Emojis.warning} Você precisa mencionar um Darling para beijar!` });
    await this.handleInteraction(message, message.author, target, message.guildId!);
  },

  async handleInteraction(context: ChatInputCommandInteraction | Message, author: any, target: any, guildId: string) {
    const isInteraction = context instanceof ChatInputCommandInteraction;

    if (target.id === author.id) {
      const msg = `${Emojis.warning} Você não pode se beijar sozinho, Darling! 🦖🌸`;
      return isInteraction ? context.editReply({ content: msg }) : context.reply({ content: msg });
    }

    // Verificar Cooldown individual para 'beijar'
    const cooldown = await CooldownService.checkCooldown(author.id, guildId, 'beijar');
    if (cooldown.inCooldown) {
      const embed = ZeroTwoEmbed.error('Calma, Darling!', `Você precisa esperar **${cooldown.remainingFormatted}** para beijar alguém novamente!`);
      return isInteraction ? context.editReply({ embeds: [embed] }) : context.reply({ embeds: [embed] });
    }

    // Sucesso! Agora definimos o cooldown apenas para este comando
    await CooldownService.setCooldown(author.id, guildId, 'beijar');

    const embed = await SocialService.executeInteraction(
      'beijar', 
      author.id, 
      target.id, 
      author.username, 
      target.username, 
      guildId
    );
    
    return isInteraction 
      ? context.editReply({ content: `<@${target.id}>`, embeds: [embed] })
      : context.reply({ content: `<@${target.id}>`, embeds: [embed] });
  }
};
