import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, GuildMember, User } from 'discord.js';
import { ZeroTwoEmbed } from '../../utils/embeds.js';
import { ModCaseService } from '../../database/models/ModCase.js';
import { Emojis } from '../../utils/emojis.js';
import ms from 'ms';

export default {
  data: new SlashCommandBuilder()
    .setName('mod')
    .setDescription('Comandos de punição e moderação do Garden.')
    .addSubcommand(sub =>
      sub.setName('ban')
        .setDescription('Bane um usuário do servidor.')
        .addUserOption(opt => opt.setName('usuario').setDescription('Usuário a ser banido').setRequired(true))
        .addStringOption(opt => opt.setName('motivo').setDescription('Motivo do banimento').setRequired(false))
    )
    .addSubcommand(sub =>
      sub.setName('unban')
        .setDescription('Desbane um usuário pelo ID.')
        .addStringOption(opt => opt.setName('userid').setDescription('ID do usuário').setRequired(true))
        .addStringOption(opt => opt.setName('motivo').setDescription('Motivo').setRequired(false))
    )
    .addSubcommand(sub =>
      sub.setName('kick')
        .setDescription('Expulsa um usuário do servidor.')
        .addUserOption(opt => opt.setName('usuario').setDescription('Usuário a ser expulso').setRequired(true))
        .addStringOption(opt => opt.setName('motivo').setDescription('Motivo da expulsão').setRequired(false))
    )
    .addSubcommand(sub =>
      sub.setName('mute')
        .setDescription('Silencia (timeout) um usuário.')
        .addUserOption(opt => opt.setName('usuario').setDescription('Usuário a ser mutado').setRequired(true))
        .addStringOption(opt => opt.setName('tempo').setDescription('Duração (ex: 1h, 30m, 1d)').setRequired(true))
        .addStringOption(opt => opt.setName('motivo').setDescription('Motivo do mute').setRequired(false))
    )
    .addSubcommand(sub =>
      sub.setName('unmute')
        .setDescription('Remove o silenciamento (timeout) de um usuário.')
        .addUserOption(opt => opt.setName('usuario').setDescription('Usuário').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('clear')
        .setDescription('Limpa mensagens do chat atual.')
        .addIntegerOption(opt => opt.setName('quantidade').setDescription('Número de mensagens (1-100)').setRequired(true))
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();
    const guild = interaction.guild!;

    if (sub === 'ban') {
      const targetUser = interaction.options.getUser('usuario', true);
      const reason = interaction.options.getString('motivo') || 'Nenhum motivo especificado.';
      const member = await guild.members.fetch(targetUser.id).catch(() => null);

      if (!member) {
        return interaction.editReply({ embeds: [ZeroTwoEmbed.error('Erro', 'Usuário não encontrado no servidor.')] });
      }

      try {
        await targetUser.send({
          embeds: [ZeroTwoEmbed.error('Você foi banido!', `${Emojis.ban_phrase} • Servidor: **${guild.name}**\n• Motivo: **${reason}**\n• A Zero Two não tolera indisciplina no Garden.`)]
        }).catch(() => {});

        const caseId = await ModCaseService.createCase(guild.id, targetUser.id, interaction.user.id, 'BAN', reason);
        await member.ban({ reason });

        await interaction.editReply({
          embeds: [ZeroTwoEmbed.success(`Usuário Banido [Case #${caseId}]`, `${Emojis.case} • **${targetUser.tag}** foi banido com sucesso.\n• Motivo: ${reason}`)]
        });
      } catch (err: any) {
        await interaction.editReply({ embeds: [ZeroTwoEmbed.error('Erro', `Não foi possível banir o usuário: ${err.message}`)] });
      }
    } else if (sub === 'unban') {
      const userId = interaction.options.getString('userid', true);
      const reason = interaction.options.getString('motivo') || 'Nenhum motivo.';

      try {
        await guild.members.unban(userId, reason);
        await interaction.editReply({
          embeds: [ZeroTwoEmbed.success('Usuário Desbanido', `• ID: **${userId}** desbanido com sucesso.`)]
        });
      } catch (err: any) {
        await interaction.editReply({ embeds: [ZeroTwoEmbed.error('Erro', `Não foi possível desbanir: ${err.message}`)] });
      }
    } else if (sub === 'kick') {
      const targetUser = interaction.options.getUser('usuario', true);
      const reason = interaction.options.getString('motivo') || 'Nenhum motivo especificado.';
      const member = await guild.members.fetch(targetUser.id).catch(() => null);

      if (!member) {
        return interaction.editReply({ embeds: [ZeroTwoEmbed.error('Erro', 'Usuário não encontrado.')] });
      }

      try {
        await targetUser.send({
          embeds: [ZeroTwoEmbed.error('Você foi expulso!', `${Emojis.ban_phrase} • Servidor: **${guild.name}**\n• Motivo: **${reason}**`)]
        }).catch(() => {});

        const caseId = await ModCaseService.createCase(guild.id, targetUser.id, interaction.user.id, 'KICK', reason);
        await member.kick(reason);

        await interaction.editReply({
          embeds: [ZeroTwoEmbed.success(`Usuário Expulso [Case #${caseId}]`, `${Emojis.case} • **${targetUser.tag}** foi expulso com sucesso.`)]
        });
      } catch (err: any) {
        await interaction.editReply({ embeds: [ZeroTwoEmbed.error('Erro', `Não foi possível expulsar: ${err.message}`)] });
      }
    } else if (sub === 'mute') {
      const targetUser = interaction.options.getUser('usuario', true);
      const timeStr = interaction.options.getString('tempo', true);
      const reason = interaction.options.getString('motivo') || 'Nenhum motivo especificado.';
      const member = await guild.members.fetch(targetUser.id).catch(() => null);

      if (!member) {
        return interaction.editReply({ embeds: [ZeroTwoEmbed.error('Erro', 'Usuário não encontrado.')] });
      }

      const durationMs = ms(timeStr);
      if (!durationMs || durationMs > 28 * 24 * 60 * 60 * 1000) {
        return interaction.editReply({ embeds: [ZeroTwoEmbed.error('Tempo inválido', 'Por favor, forneça um tempo válido (ex: 1h, 30m, 1d) até no máximo 28 dias.')] });
      }

      try {
        await targetUser.send({
          embeds: [ZeroTwoEmbed.error('Você foi silenciado (Mute)!', `${Emojis.mute_phrase} • Servidor: **${guild.name}**\n• Duração: **${timeStr}**\n• Motivo: **${reason}**`)]
        }).catch(() => {});

        const caseId = await ModCaseService.createCase(guild.id, targetUser.id, interaction.user.id, 'MUTE', reason, timeStr);
        await member.timeout(durationMs, reason);

        await interaction.editReply({
          embeds: [ZeroTwoEmbed.success(`Usuário Silenciado [Case #${caseId}]`, `${Emojis.case} • **${targetUser.tag}** foi mutado por **${timeStr}**.\n• Motivo: ${reason}`)]
        });
      } catch (err: any) {
        await interaction.editReply({ embeds: [ZeroTwoEmbed.error('Erro', `Não foi possível mutar: ${err.message}`)] });
      }
    } else if (sub === 'unmute') {
      const targetUser = interaction.options.getUser('usuario', true);
      const member = await guild.members.fetch(targetUser.id).catch(() => null);

      if (!member) {
        return interaction.editReply({ embeds: [ZeroTwoEmbed.error('Erro', 'Usuário não encontrado.')] });
      }

      try {
        await member.timeout(null);
        await interaction.editReply({
          embeds: [ZeroTwoEmbed.success('Silenciamento Removido', `• O silenciamento de **${targetUser.tag}** foi removido.`)]
        });
      } catch (err: any) {
        await interaction.editReply({ embeds: [ZeroTwoEmbed.error('Erro', `Não foi possível remover o mute: ${err.message}`)] });
      }
    } else if (sub === 'clear') {
      const amount = interaction.options.getInteger('quantidade', true);
      if (amount < 1 || amount > 100) {
        return interaction.editReply({ embeds: [ZeroTwoEmbed.error('Quantidade Inválida', 'Você pode limpar entre 1 e 100 mensagens por vez.')] });
      }

      const channel = interaction.channel;
      if (!channel || !channel.isTextBased() || channel.isDMBased()) {
        return interaction.editReply({ embeds: [ZeroTwoEmbed.error('Erro', 'Canal inválido para limpeza.')] });
      }

      try {
        const deleted = await channel.bulkDelete(amount, true);
        await interaction.editReply({
          embeds: [ZeroTwoEmbed.success('Chat Limpo', `• **${deleted.size}** mensagens foram apagadas com sucesso do Garden.`)]
        });
        setTimeout(() => interaction.deleteReply().catch(() => {}), 4000);
      } catch (err: any) {
        await interaction.editReply({ embeds: [ZeroTwoEmbed.error('Erro', `Não foi possível limpar as mensagens: ${err.message}`)] });
      }
    }
  },
};
