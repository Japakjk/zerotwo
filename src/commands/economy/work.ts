import { SlashCommandBuilder, ChatInputCommandInteraction, Message } from 'discord.js';
import { EconomyService } from '../../services/economy/EconomyService.js';
import { ZeroTwoEmbed } from '../../utils/embeds.js';
import { Emojis } from '../../utils/emojis.js';
import { CooldownService } from '../../services/economy/CooldownService.js';
import { SocialGifs } from '../../utils/socialGifs.js';

const jobs = [
  { name: 'Pistoleiro(a)', phrases: ['Você pilotou o Franxx com maestria e ganhou **{amount}** D-Coins!'] },
  { name: 'Cozinheiro(a)', phrases: ['Você preparou um mel delicioso para a Zero Two e recebeu **{amount}** D-Coins!'] },
  { name: 'Sentinela', phrases: ['Você vigiou o Garden e foi recompensado com **{amount}** D-Coins!'] },
  { name: 'Cientista', phrases: ['Você estudou as células Klaxossauro e ganhou **{amount}** D-Coins!'] }
];

export default {
  data: new SlashCommandBuilder()
    .setName('work')
    .setDescription('Trabalhe para ganhar D-Coins!'),

  async execute(interaction: ChatInputCommandInteraction) {
    await this.handleWork(interaction, interaction.user, interaction.guildId!);
  },

  async executeText(message: Message, args: string[]) {
    await this.handleWork(message, message.author, message.guildId!);
  },

  async handleWork(context: ChatInputCommandInteraction | Message, user: any, guildId: string) {
    const isInteraction = context instanceof ChatInputCommandInteraction;
    
    // Verificar Cooldown (Apenas checa, não define)
    const cd = await CooldownService.checkCooldown(user.id, guildId, 'work');
    if (cd.inCooldown) {
      const msg = `${Emojis.warning} **Darling**, você está exausto(a)! Descanse um pouco e volte em **${cd.remainingFormatted}**.`;
      return isInteraction ? context.editReply({ content: msg }) : context.reply({ content: msg });
    }

    // Só agora definimos o cooldown, pois o comando vai ser executado com sucesso
    await CooldownService.setCooldown(user.id, guildId, 'work');

    const job = jobs[Math.floor(Math.random() * jobs.length)];
    let reward = Math.floor(Math.random() * (250000 - 100000 + 1)) + 100000;
    
    const multiplier = await EconomyService.getVipMultiplier(user.id, guildId);
    reward = Math.floor(reward * multiplier);
    
    await EconomyService.addCoins(user.id, guildId, reward, `Trabalhou como ${job.name}`);

    const phrase = job.phrases[Math.floor(Math.random() * job.phrases.length)].replace('{amount}', reward.toLocaleString());

    const embed = new ZeroTwoEmbed()
      .setTitle(`${Emojis.economy} ${job.name}`)
      .setDescription(
        `${Emojis.seta} ${phrase} ${Emojis.coin}\n\n` +
        `[\`Visualizar o momento\`](<${SocialGifs.pescando}>)`,
      )
      .setImage(SocialGifs.pescando)
      .setFooter({ text: 'Continue assim, Darling!' });

    return isInteraction ? context.editReply({ embeds: [embed] }) : context.reply({ embeds: [embed] });
  }
};
