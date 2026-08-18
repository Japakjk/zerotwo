import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, Message } from 'discord.js';
import { EconomyService } from '../../services/economy/EconomyService.js';
import { ZeroTwoEmbed } from '../../utils/embeds.js';
import { Emojis } from '../../utils/emojis.js';

export default {
  data: new SlashCommandBuilder()
    .setName('vip')
    .setDescription('Exibe o status do seu VIP, bônus de coins e redução de cooldowns.')
    .addUserOption(opt => opt.setName('usuario').setDescription('Ver o VIP de outro Darling').setRequired(false)),

  async execute(interaction: ChatInputCommandInteraction) {
    const target = interaction.options.getUser('usuario') || interaction.user;
    const guildId = interaction.guildId!;
    await this.sendVipEmbed(interaction, target, guildId);
  },

  async executeText(message: Message, args: string[]) {
    const target = message.mentions.users.first() || (args[0] ? await message.client.users.fetch(args[0]).catch(() => null) : message.author);
    const guildId = message.guildId!;
    await this.sendVipEmbed(message, target, guildId);
  },

  async sendVipEmbed(context: ChatInputCommandInteraction | Message, target: any, guildId: string) {
    const isInteraction = context instanceof ChatInputCommandInteraction;
    const vipLevel = await EconomyService.getVipLevel(target.id, guildId);
    
    const perks: Record<number, { name: string; bonus: string; cooldown: string }> = {
      0: { name: 'Membro Comum', bonus: '1x (Padrão)', cooldown: '100%' },
      1: { name: 'VIP 1 (Darling Iniciante)', bonus: '1.25x (+25%)', cooldown: '90%' },
      2: { name: 'VIP 2 (Piloto Dedicado)', bonus: '1.5x (+50%)', cooldown: '80%' },
      3: { name: 'VIP 3 (Strelizia Elite)', bonus: '2.0x (+100%)', cooldown: '70%' },
      4: { name: 'VIP 4 (Comandante do Garden)', bonus: '2.5x (+150%)', cooldown: '60%' },
      5: { name: 'VIP 5 (Klaxossauro Supremo)', bonus: '3.0x (+200%)', cooldown: '50%' }
    };

    const currentPerk = perks[vipLevel] || perks[5];

    const embed = new ZeroTwoEmbed()
      .setTitle(`${Emojis.achievement} Status VIP de ${target.username}`)
      .setThumbnail(target.displayAvatarURL())
      .setDescription(`${Emojis.seta} Olá, **Darling**! Aqui estão as informações detalhadas da sua patente no Garden:`)
      .addFields(
        { name: `${Emojis.rank} Nível VIP`, value: `**${vipLevel} / 5** (${currentPerk.name})`, inline: true },
        { name: `${Emojis.coin} Bônus de Coins`, value: `**${currentPerk.bonus}**`, inline: true },
        { name: `${Emojis.clock} Redução de Cooldown`, value: `**${currentPerk.cooldown}** do tempo original`, inline: true },
        { name: `${Emojis.seta_menor} Vantagens Exclusivas`, value: `• Acesso prioritário aos jogos de economia.\n• Imunidade a taxas de transferência alta.\n• Estampa especial no perfil da Zero Two.`, inline: false }
      )
      .setFooter({ text: 'Deseja subir de patente? Adquira um VIP superior com a staff!' });

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('open_ticket_vip')
        .setLabel('Comprar / Upar VIP')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('🎫')
    );

    if (isInteraction) {
      await context.editReply({ embeds: [embed], components: [row] });
    } else {
      await context.reply({ embeds: [embed], components: [row] });
    }
  }
};
