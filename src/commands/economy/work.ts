import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { EconomyService } from '../../services/economy/EconomyService.js';
import { ZeroTwoEmbed } from '../../utils/embeds.js';
import { Emojis } from '../../utils/emojis.js';
import { CooldownService } from '../../services/economy/CooldownService.js';

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
    const userId = interaction.user.id;
    const guildId = interaction.guildId!;

    // Verificar Cooldown
    const cd = await CooldownService.checkCooldown(userId, guildId, 'work');
    if (cd.inCooldown) {
      const minutes = Math.ceil(cd.remaining / 60);
      return interaction.editReply({ 
        content: `${Emojis.warning} **Darling**, você está exausto(a)! Descanse um pouco e volte em **${minutes} minutos**.` 
      });
    }

    const job = jobs[Math.floor(Math.random() * jobs.length)];
    // Recompensa: 100k a 250k
    let reward = Math.floor(Math.random() * (250000 - 100000 + 1)) + 100000;
    
    // Aplicar Multiplicador VIP
    const multiplier = await EconomyService.getVipMultiplier(userId, guildId);
    reward = Math.floor(reward * multiplier);
    
    await EconomyService.addCoins(userId, guildId, reward, `Trabalhou como ${job.name}`);

    const message = job.phrases[Math.floor(Math.random() * job.phrases.length)].replace('{amount}', reward.toLocaleString());

    const embed = new ZeroTwoEmbed()
      .setTitle(`${Emojis.cat_administracao} ${job.name}`)
      .setDescription(`${Emojis.seta} ${message} ${Emojis.coin}`)
      .setFooter({ text: 'Continue assim, Darling! 🦖🌸' });

    await interaction.editReply({ embeds: [embed] });
  },
};
