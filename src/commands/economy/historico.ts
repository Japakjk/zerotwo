import { SlashCommandBuilder, ChatInputCommandInteraction, Message } from 'discord.js';
import { EconomyService } from '../../services/economy/EconomyService.js';
import { ZeroTwoEmbed } from '../../utils/embeds.js';
import { Emojis } from '../../utils/emojis.js';

export default {
  data: new SlashCommandBuilder()
    .setName('historico')
    .setDescription('Veja suas últimas transações de D-Coins no Garden.'),

  async execute(interaction: ChatInputCommandInteraction) {
    const history = await EconomyService.getHistory(interaction.user.id, interaction.guildId!);

    if (history.length === 0) {
      return interaction.editReply({ content: `${Emojis.warning} Você ainda não possui transações registradas, Darling.` });
    }

    const embed = new ZeroTwoEmbed()
      .setTitle(`📊 Histórico Financeiro — ${interaction.user.username}`)
      .setDescription(
        history.map((tx: any) => {
          const emoji = tx.amount > 0 ? '📈' : '📉';
          const typeLabel = tx.type === 'PAY' ? 'Transferência' : 
                            tx.type === 'DAILY' ? 'Diário' : 
                            tx.type === 'GAME' ? 'Jogo' : 
                            tx.type === 'REWARD' ? 'Recompensa' : tx.type;
          
          return `${emoji} **${tx.amount.toLocaleString('pt-BR')} D-Coins** (${typeLabel})\n` +
                 `└ *${tx.reason}* — <t:${Math.floor(tx.createdAt.getTime() / 1000)}:R>`;
        }).join('\n\n')
      )
      .setFooter({ text: 'Exibindo as últimas 10 transações' });

    await interaction.editReply({ embeds: [embed] });
  },

  async executeText(message: Message) {
    const history = await EconomyService.getHistory(message.author.id, message.guildId!);

    if (history.length === 0) {
      return message.reply(`${Emojis.warning} Você ainda não possui transações registradas.`);
    }

    const embed = new ZeroTwoEmbed()
      .setTitle(`📊 Histórico Financeiro — ${message.author.username}`)
      .setDescription(
        history.map((tx: any) => {
          const status = tx.amount > 0 ? '+' : '';
          return `\`${tx.createdAt.toLocaleDateString('pt-BR')}\` | **${status}${tx.amount.toLocaleString('pt-BR')}** | ${tx.reason}`;
        }).join('\n')
      );

    await message.reply({ embeds: [embed] });
  }
};
