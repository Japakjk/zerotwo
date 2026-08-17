import { SlashCommandBuilder, ChatInputCommandInteraction, Message } from 'discord.js';
import { SocialService } from '../../services/social/SocialService.js';
import { CooldownService } from '../../services/economy/CooldownService.js';
import { ZeroTwoEmbed } from '../../utils/embeds.js';
import { Emojis } from '../../utils/emojis.js';

export default {
  data: new SlashCommandBuilder()
    .setName('socar')
    .setDescription('Dê um soco divertido em um Darling.')
    .addUserOption(opt => opt.setName('usuario').setDescription('O Darling que você quer socar').setRequired(true)),

  async execute(interaction: ChatInputCommandInteraction) {
    const target = interaction.options.getUser('usuario', true);
    await this.handleInteraction(interaction, interaction.user, target, interaction.guildId!);
  },

  async executeText(message: Message, args: string[]) {
    const target = message.mentions.users.first() || (args[0] ? await message.client.users.fetch(args[0]).catch(() => null) : null);
    if (!target) return message.reply({ content: `${Emojis.warning} Você precisa mencionar um Darling para socar!` });
    await this.handleInteraction(message, message.author, target, message.guildId!);
  },

  async handleInteraction(context: ChatInputCommandInteraction | Message, author: any, target: any, guildId: string) {
    const isInteraction = context instanceof ChatInputCommandInteraction;

    if (target.id === author.id) {
      const msg = `${Emojis.warning} Você não pode se socar, Darling! A Zero Two não gosta de auto-flagelação. 🦖🌸`;
      return isInteraction ? context.editReply({ content: msg }) : context.reply({ content: msg });
    }

    // Verificar Cooldown individual para 'socar'
    const cooldown = await CooldownService.checkCooldown(author.id, guildId, 'socar');
    if (cooldown.inCooldown) {
      const embed = ZeroTwoEmbed.error('Calma, Darling!', `Você precisa esperar **${cooldown.remainingFormatted}** para socar alguém novamente!`);
      return isInteraction ? context.editReply({ embeds: [embed] }) : context.reply({ embeds: [embed] });
    }

    // Sucesso! Definimos o cooldown individual
    await CooldownService.setCooldown(author.id, guildId, 'socar');

    const embed = await SocialService.executeInteraction(
      'socar', 
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
