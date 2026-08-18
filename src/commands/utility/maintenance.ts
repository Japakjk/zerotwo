import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import { MaintenanceService } from '../../services/core/MaintenanceService.js';
import { OwnerService } from '../../services/owner/OwnerService.js';

export default {
  data: new SlashCommandBuilder()
    .setName('maintenance')
    .setDescription('Ativa ou desativa o modo de manutenção do bot.')
    .addBooleanOption((option) => option.setName('ativo').setDescription('True para ativar manutenção').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!OwnerService.isOwner(interaction.user.id)) {
      return interaction.reply({ content: '❌ Apenas o owner pode alterar o modo de manutenção.', ephemeral: true });
    }

    const active = interaction.options.getBoolean('ativo', true);
    MaintenanceService.setEnabled(active);

    const embed = new EmbedBuilder()
      .setColor(active ? 0xf0a500 : 0x3ecf8e)
      .setTitle(active ? '🧰 Modo de manutenção ativado' : '✅ Modo de manutenção desativado')
      .setDescription(active ? 'Comandos comuns foram bloqueados para usuários e o bot está em manutenção.' : 'O bot voltou ao normal.');

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
