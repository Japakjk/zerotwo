import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, Message, User } from 'discord.js';
import { EconomyService } from '../../services/economy/EconomyService.js';
import { CooldownService } from '../../services/economy/CooldownService.js';
import { Emojis } from '../../utils/emojis.js';

export default {
  data: new SlashCommandBuilder()
    .setName('roubar')
    .setDescription('Tente roubar D-Coins da carteira de outro Darling (Cuidado!)')
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('Quem você deseja roubar')
        .setRequired(true)),

  async execute(interaction: ChatInputCommandInteraction) {
    const target = interaction.options.getUser('usuario', true);
    await this.run(interaction.user.id, interaction.guildId!, target, (payload: any) => interaction.editReply(payload));
  },

  async executeText(message: Message, args: string[]) {
    const target = message.mentions.users.first() || (args[0] ? await message.client.users.fetch(args[0]).catch(() => null) : null);
    if (!target) return message.reply({ content: 'Mencione ou informe o ID de quem você deseja roubar. Exemplo: `zero!roubar @usuario`' });
    await this.run(message.author.id, message.guild!.id, target, (payload: any) => message.reply(payload));
  },

  async run(userId: string, guildId: string, target: User, send: (payload: any) => Promise<unknown>) {
    if (target.id === userId) {
      return send({ content: `${Emojis.warning} **Darling**, você não pode roubar a si mesmo!` });
    }

    if (target.bot) {
      return send({ content: `${Emojis.warning} **Darling**, você não pode roubar um bot!` });
    }

    const cdCheck = await CooldownService.checkCooldown(userId, guildId, 'roubar');
    if (cdCheck.inCooldown) {
      const minutes = Math.ceil(cdCheck.remaining / 60);
      return send({ content: `${Emojis.warning} **Darling**, você está muito cansado(a) para roubar agora! Aguarde **${minutes} minutos**.` });
    }

    const targetBalance = await EconomyService.getBalance(target.id, guildId);
    if (targetBalance.coins < 5000) {
      return send({ content: `${Emojis.warning} **Darling**, ${target} é muito pobre para valer a pena roubar (menos de 5.000 D-Coins na carteira).` });
    }

    // 40% de chance de sucesso
    const success = Math.random() < 0.40;

    if (success) {
      const stolenAmount = Math.floor(targetBalance.coins * 0.25); // Rouba 25%
      await EconomyService.removeCoins(target.id, guildId, stolenAmount, `Roubado por ${userId}`, 'ROB');
      await EconomyService.addCoins(userId, guildId, stolenAmount, `Roubo contra ${target.id}`, 'ROB');

      const embed = new EmbedBuilder()
        .setColor(0xff3b69)
        .setTitle(`${Emojis.achievement} **Roubo Bem-Sucedido!**`)
        .setDescription(`Você conseguiu emboscar ${target} e roubou **${stolenAmount.toLocaleString()} D-Coins** ${Emojis.coin}!\n\n*A Zero Two achou isso bastante ousado...*`)
        .setTimestamp();

      await send({ embeds: [embed] });
    } else {
      const fine = 10000;
      await EconomyService.removeCoins(userId, guildId, fine, 'Multa por tentativa de roubo', 'ROB');

      const embed = new EmbedBuilder()
        .setColor(0xff3b69)
        .setTitle(`${Emojis.warning} **Roubo Fracassado!**`)
        .setDescription(`Você foi pego(a) em flagrante tentando roubar ${target}!\n\n*A polícia do Garden multou você em* **${fine.toLocaleString()} D-Coins** ${Emojis.coin}.`)
        .setTimestamp();

      await send({ embeds: [embed] });
    }
  }
};
