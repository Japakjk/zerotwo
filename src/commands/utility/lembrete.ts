import { 
  SlashCommandBuilder, 
  ChatInputCommandInteraction, 
  Message, 
  ActionRowBuilder, 
  StringSelectMenuBuilder,
  ComponentType
} from 'discord.js';
import ms from 'ms';
import { ReminderService } from '../../services/utility/ReminderService.js';
import { ZeroTwoEmbed } from '../../utils/embeds.js';
import { Emojis } from '../../utils/emojis.js';

export default {
  data: new SlashCommandBuilder()
    .setName('lembrete')
    .setDescription('Gerencia seus lembretes no Garden.')
    .addSubcommand(sub => 
      sub.setName('criar')
        .setDescription('Cria um novo lembrete.')
        .addStringOption(opt => opt.setName('tempo').setDescription('Tempo (ex: 30m, 2h, 1d)').setRequired(true))
        .addStringOption(opt => opt.setName('motivo').setDescription('O que eu devo te lembrar?').setRequired(true))
    )
    .addSubcommand(sub => 
      sub.setName('listar')
        .setDescription('Lista seus lembretes ativos.')
    )
    .addSubcommand(sub => 
      sub.setName('cancelar')
        .setDescription('Cancela um lembrete ativo.')
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'criar') {
      const tempoStr = interaction.options.getString('tempo', true);
      const motivo = interaction.options.getString('motivo', true);
      
      const tempoMs = ms(tempoStr);
      if (!tempoMs || tempoMs < 60000) {
        return interaction.editReply({ content: `${Emojis.ban} Darling, o tempo informado é inválido ou curto demais (mínimo 1 minuto). Use formatos como \`10m\`, \`2h\`, \`1d\`.` });
      }

      const remindAt = new Date(Date.now() + tempoMs);
      await ReminderService.createReminder(
        interaction.user.id,
        interaction.guildId!,
        interaction.channelId,
        motivo,
        remindAt
      );

      const embed = ZeroTwoEmbed.success(
        'Lembrete Registrado',
        `Entendido, **Darling**! Vou te lembrar sobre:\n\n> *"${motivo}"*\n\n⏳ **Quando:** <t:${Math.floor(remindAt.getTime() / 1000)}:R>`
      );

      await interaction.editReply({ embeds: [embed] });
    }

    if (subcommand === 'listar') {
      const reminders = await ReminderService.getUserReminders(interaction.user.id, interaction.guildId!);
      
      if (reminders.length === 0) {
        return interaction.editReply({ content: `${Emojis.warning} Você não tem lembretes ativos no momento, Darling.` });
      }

      const embed = new ZeroTwoEmbed()
        .setTitle('⏰ Seus Lembretes Ativos')
        .setDescription(
          reminders.map((r: any, i: number) => `**${i + 1}.** "${r.reason}"\n└ ⏳ <t:${Math.floor(r.remindAt.getTime() / 1000)}:R>`).join('\n\n')
        );

      await interaction.editReply({ embeds: [embed] });
    }

    if (subcommand === 'cancelar') {
      const reminders = await ReminderService.getUserReminders(interaction.user.id, interaction.guildId!);
      
      if (reminders.length === 0) {
        return interaction.editReply({ content: `${Emojis.warning} Você não tem lembretes para cancelar, Darling.` });
      }

      const select = new StringSelectMenuBuilder()
        .setCustomId('cancel_reminder')
        .setPlaceholder('Selecione um lembrete para cancelar')
        .addOptions(
          reminders.slice(0, 25).map((r: any) => ({
            label: r.reason.substring(0, 50),
            description: `Para: ${r.remindAt.toLocaleString('pt-BR')}`,
            value: r._id.toString()
          }))
        );

      const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);
      
      const response = await interaction.editReply({ 
        content: 'Qual lembrete você deseja cancelar, Darling?', 
        components: [row] 
      });

      const collector = response.createMessageComponentCollector({ 
        componentType: ComponentType.StringSelect, 
        time: 30000 
      });

      collector.on('collect', async (i) => {
        if (i.user.id !== interaction.user.id) return;
        
        await ReminderService.cancelReminder(i.values[0], interaction.user.id);
        await i.update({ 
          content: `${Emojis.seta} Lembrete cancelado com sucesso, Darling! ${Emojis.achievement}`, 
          components: [], 
          embeds: [] 
        });
      });
    }
  },

  async executeText(message: Message, args: string[]) {
    const action = args[0]?.toLowerCase();

    if (action === 'cancelar' || action === 'listar') {
      // Para simplificar no modo texto, redirecionamos para slash ou damos aviso
      return message.reply(`${Emojis.warning} Darling, use o comando por barra (**\`/lembrete\`**) para listar ou cancelar lembretes!`);
    }

    // Criar lembrete via texto: zero.lembrete 10m Estudar
    const tempoStr = args[0];
    const motivo = args.slice(1).join(' ');

    if (!tempoStr || !motivo) {
      return message.reply(`Use: \`zero.lembrete <tempo> <motivo>\`, Darling!`);
    }

    const tempoMs = ms(tempoStr);
    if (!tempoMs || tempoMs < 60000) {
      return message.reply(`${Emojis.ban} Tempo inválido! Mínimo 1 minuto.`);
    }

    const remindAt = new Date(Date.now() + tempoMs);
    await ReminderService.createReminder(
      message.author.id,
      message.guildId!,
      message.channelId,
      motivo,
      remindAt
    );

    message.reply(`${Emojis.seta} Lembrete anotado! Vou te avisar em <t:${Math.floor(remindAt.getTime() / 1000)}:R>.`);
  }
};
