import { SlashCommandBuilder, ChatInputCommandInteraction, Message, PermissionFlagsBits } from 'discord.js';
import { MaintenanceService } from '../../services/utility/MaintenanceService.js';
import { ZeroTwoEmbed } from '../../utils/embeds.js';
import { Emojis } from '../../utils/emojis.js';
import { config } from '../../config/config.js';

const OWNER_ID = config.OWNER_ID;

export default {
  data: new SlashCommandBuilder()
    .setName('comando')
    .setDescription('[OWNER] Habilita ou desabilita um comando específico.')
    .addStringOption(opt => opt.setName('nome').setDescription('Nome do comando').setRequired(true))
    .addStringOption(opt => 
      opt.setName('status')
        .setDescription('Habilitar ou desabilitar')
        .setRequired(true)
        .addChoices(
          { name: 'Habilitar', value: 'on' },
          { name: 'Desabilitar', value: 'off' }
        )
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction: ChatInputCommandInteraction) {
    if (interaction.user.id !== OWNER_ID) {
      return interaction.editReply({ content: `${Emojis.ban} Apenas meu Darling (Owner) pode usar este comando!` });
    }

    const commandName = interaction.options.getString('nome', true).toLowerCase();
    const status = interaction.options.getString('status', true);
    const isEnabled = status === 'on';

    if (commandName === 'comando' || commandName === 'maintenance') {
      return interaction.editReply({ content: `${Emojis.ban} Você não pode desativar os comandos de emergência, Darling!` });
    }

    await MaintenanceService.toggleCommand(commandName, isEnabled);

    const embed = ZeroTwoEmbed.success(
      `Comando ${isEnabled ? 'Habilitado' : 'Desabilitado'}`,
      `${Emojis.seta} O comando **\`${commandName}\`** foi **${isEnabled ? 'ativado' : 'desativado'}** com sucesso! ${Emojis.achievement}`
    );

    await interaction.editReply({ embeds: [embed] });
  },

  async executeText(message: Message, args: string[]) {
    if (message.author.id !== OWNER_ID) return;

    const commandName = args[0]?.toLowerCase();
    const status = args[1]?.toLowerCase();

    if (!commandName || (status !== 'on' && status !== 'off')) {
      return message.reply(`Use: \`zero.comando <nome> <on/off>\`, Darling!`);
    }

    if (commandName === 'comando' || commandName === 'maintenance') {
      return message.reply(`${Emojis.ban} Você não pode desativar os comandos de emergência!`);
    }

    const isEnabled = status === 'on';
    await MaintenanceService.toggleCommand(commandName, isEnabled);

    const embed = ZeroTwoEmbed.success(
      `Comando ${isEnabled ? 'Habilitado' : 'Desabilitado'}`,
      `${Emojis.seta} O comando **\`${commandName}\`** foi **${isEnabled ? 'ativado' : 'desativado'}** com sucesso! ${Emojis.achievement}`
    );

    await message.reply({ embeds: [embed] });
  }
};
