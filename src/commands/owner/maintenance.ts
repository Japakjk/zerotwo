import { 
  SlashCommandBuilder, 
  ChatInputCommandInteraction, 
  Message, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle,
  PermissionFlagsBits
} from 'discord.js';
import { MaintenanceService } from '../../services/utility/MaintenanceService.js';
import { ZeroTwoEmbed } from '../../utils/embeds.js';
import { Emojis } from '../../utils/emojis.js';
import { config } from '../../config/config.js';

const OWNER_ID = config.OWNER_ID;

export default {
  data: new SlashCommandBuilder()
    .setName('maintenance')
    .setDescription('[OWNER] Gerencia o modo de manutenção do bot via painel interativo.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  deferEphemeral: true,

  async execute(interaction: ChatInputCommandInteraction) {
    if (interaction.user.id !== OWNER_ID) {
      return interaction.editReply({ content: `${Emojis.ban} Apenas meu Darling (Owner) pode usar este comando!` });
    }

    const maintenance = await MaintenanceService.checkMaintenance();
    
    const embed = new ZeroTwoEmbed()
      .setTitle('🛠️ Painel de Manutenção Global')
      .setDescription(
        `Olá Darling! Aqui você pode controlar o acesso ao Garden.\n\n` +
        `• **Status Atual**: ${maintenance.enabled ? '🔴 **ATIVADO**' : '🟢 **DESATIVADO**'}\n` +
        `• **Motivo Atual**: \`${maintenance.reason}\`\n\n` +
        `Clique no botão abaixo para alterar o estado.`
      );

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('toggle_maintenance')
        .setLabel(maintenance.enabled ? 'Desativar Manutenção' : 'Ativar Manutenção')
        .setStyle(maintenance.enabled ? ButtonStyle.Success : ButtonStyle.Danger)
        .setEmoji(maintenance.enabled ? '🟢' : '🔴')
    );

    await interaction.editReply({ embeds: [embed], components: [row] });
  },

  async executeText(message: Message, args: string[]) {
    if (message.author.id !== OWNER_ID) return;

    const maintenance = await MaintenanceService.checkMaintenance();
    
    const embed = new ZeroTwoEmbed()
      .setTitle('🛠️ Painel de Manutenção Global')
      .setDescription(
        `Olá Darling! Aqui você pode controlar o acesso ao Garden.\n\n` +
        `• **Status Atual**: ${maintenance.enabled ? '🔴 **ATIVADO**' : '🟢 **DESATIVADO**'}\n` +
        `• **Motivo Atual**: \`${maintenance.reason}\`\n\n` +
        `Clique no botão abaixo para alterar o estado.`
      );

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('toggle_maintenance')
        .setLabel(maintenance.enabled ? 'Desativar Manutenção' : 'Ativar Manutenção')
        .setStyle(maintenance.enabled ? ButtonStyle.Success : ButtonStyle.Danger)
        .setEmoji(maintenance.enabled ? '🟢' : '🔴')
    );

    await message.reply({ embeds: [embed], components: [row] });
  }
};
