import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  ComponentType,
  Message,
  PermissionFlagsBits,
  SlashCommandBuilder,
  User,
} from 'discord.js';
import { ModerationService } from '../../services/moderation/ModerationService.js';
import { ZeroTwoEmbed } from '../../utils/embeds.js';
import { Emojis } from '../../utils/emojis.js';
import { SocialGifs } from '../../utils/socialGifs.js';

function banErrorMessage(error: unknown): string {
  const code = error instanceof Error ? error.message : '';
  const messages: Record<string, string> = {
    BOT_MISSING_BAN_MEMBERS: 'Eu não tenho a permissão `BanMembers` necessária para executar esta ação.',
    MODERATOR_MISSING_BAN_MEMBERS: 'Você não possui a permissão `BanMembers` necessária para executar esta ação.',
    CANNOT_BAN_BOT: 'Eu não posso banir a mim mesma, Darling.',
    CANNOT_BAN_SELF: 'Você não pode banir a si mesmo.',
    TARGET_NOT_BANNABLE: 'Não posso banir este usuário por causa da hierarquia de cargos do Discord.',
    ALREADY_BANNED: 'Este usuário já está banido deste servidor.',
  };
  return messages[code] || 'A API do Discord recusou o banimento. Verifique permissões, hierarquia e tente novamente.';
}

function confirmationEmbed(target: User, moderatorTag: string, reason: string): ZeroTwoEmbed {
  return new ZeroTwoEmbed()
    .setTitle(`${Emojis.alerta} Confirmar punição`)
    .setDescription(
      `${Emojis.ban_phrase} Você está prestes a banir **${target.tag}** do Garden.\n\n` +
      `${Emojis.informacao} **Moderador:** ${moderatorTag}\n` +
      `${Emojis.informacao} **Motivo:** ${reason}\n\n` +
      'Use os botões abaixo para confirmar ou cancelar esta ação.',
    )
    .setImage(SocialGifs.punicao);
}

function confirmationRow(): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('ban_confirm')
      .setLabel('Confirmar banimento')
      .setStyle(ButtonStyle.Danger)
      .setEmoji(Emojis.confirmacao),
    new ButtonBuilder()
      .setCustomId('ban_cancel')
      .setLabel('Cancelar')
      .setStyle(ButtonStyle.Secondary)
      .setEmoji(Emojis.x),
  );
}

function successEmbed(target: User, moderatorTag: string, reason: string, caseId: number | string): ZeroTwoEmbed {
  return new ZeroTwoEmbed()
    .setTitle(`${Emojis.ban_phrase} Membro banido`)
    .setDescription(
      `${Emojis.confirmacao} O Darling **${target.tag}** foi removido permanentemente do Garden.\n\n` +
      `${Emojis.informacao} **Moderador:** ${moderatorTag}\n` +
      `${Emojis.informacao} **Motivo:** ${reason}\n` +
      `${Emojis.case} **Caso:** #${caseId}\n\n` +
      `[\`Visualizar a punição\`](<${SocialGifs.punicao}>)`,
    )
    .setImage(SocialGifs.punicao);
}

async function collectBanConfirmation(
  response: Message,
  moderatorId: string,
  moderatorTag: string,
  target: User,
  guildId: string,
  reason: string,
): Promise<void> {
  const collector = response.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: 30000,
  });

  collector.on('collect', async button => {
    if (button.user.id !== moderatorId) {
      await button.reply({
        content: `${Emojis.alerta} Apenas o moderador que iniciou esta punição pode responder aos botões.`,
        ephemeral: true,
      });
      return;
    }

    if (button.customId === 'ban_cancel') {
      await button.update({
        embeds: [ZeroTwoEmbed.info(`${Emojis.x} Punição cancelada`, 'Nenhuma alteração foi feita no Garden.')],
        components: [],
      });
      collector.stop('completed');
      return;
    }

    if (button.customId !== 'ban_confirm') return;

    try {
      const modCase = await ModerationService.ban(response.guild!, target.id, moderatorId, reason);
      await button.update({
        embeds: [successEmbed(target, moderatorTag, reason, modCase.caseId)],
        components: [],
      });
    } catch (error: unknown) {
      console.error('[ban] falha ao confirmar banimento', {
        guildId,
        moderatorId,
        targetId: target.id,
        error,
      });
      await button.update({
        embeds: [ZeroTwoEmbed.error(`${Emojis.alerta} Ação não concluída`, banErrorMessage(error))],
        components: [],
      });
    }
    collector.stop('completed');
  });

  collector.on('end', async (_, reasonCode) => {
    if (reasonCode === 'time') {
      await response.edit({
        embeds: [ZeroTwoEmbed.info(`${Emojis.despertador} Confirmação expirada`, 'O tempo acabou e nenhum banimento foi executado.')],
        components: [],
      }).catch(() => undefined);
    }
  });
}

async function requestBan(
  context: ChatInputCommandInteraction | Message,
  target: User,
  moderatorId: string,
  moderatorTag: string,
  guildId: string,
  reason: string,
): Promise<void> {
  const payload = {
    embeds: [confirmationEmbed(target, moderatorTag, reason)],
    components: [confirmationRow()],
  };
  const response = context instanceof ChatInputCommandInteraction
    ? await context.editReply(payload)
    : await context.reply(payload);
  await collectBanConfirmation(response, moderatorId, moderatorTag, target, guildId, reason);
}

export default {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Bane um membro do servidor após confirmação.')
    .addUserOption(opt => opt.setName('usuario').setDescription('O membro a ser banido').setRequired(true))
    .addStringOption(opt => opt.setName('motivo').setDescription('O motivo do banimento').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  async execute(interaction: ChatInputCommandInteraction) {
    const target = interaction.options.getUser('usuario', true);
    const reason = interaction.options.getString('motivo') || 'Nenhum motivo fornecido.';
    const member = await interaction.guild?.members.fetch(target.id).catch(() => null);

    if (member && !member.bannable) {
      return interaction.editReply({
        embeds: [ZeroTwoEmbed.error(`${Emojis.alerta} Ação negada`, `Eu não tenho poder suficiente para banir o Darling **${target.tag}**. Verifique a hierarquia de cargos.`)],
      });
    }

    await requestBan(interaction, target, interaction.user.id, interaction.user.tag, interaction.guildId!, reason);
  },

  async executeText(message: Message, args: string[]) {
    if (!message.member?.permissions.has(PermissionFlagsBits.BanMembers)) {
      return message.reply({ embeds: [ZeroTwoEmbed.permissionError('BanMembers')] });
    }

    const target = message.mentions.users.first() || (args[0] ? await message.client.users.fetch(args[0]).catch(() => null) : null);
    const reason = args.slice(1).join(' ') || 'Nenhum motivo fornecido.';

    if (!target) {
      return message.reply({
        embeds: [ZeroTwoEmbed.error(`${Emojis.alerta} Faltando argumento`, 'Você precisa mencionar um Darling ou fornecer um ID válido para banir.')],
      });
    }

    const member = await message.guild?.members.fetch(target.id).catch(() => null);
    if (member && !member.bannable) {
      return message.reply({
        embeds: [ZeroTwoEmbed.error(`${Emojis.alerta} Ação negada`, 'Não posso banir este usuário. Verifique minha hierarquia de cargos.')],
      });
    }

    await requestBan(message, target, message.author.id, message.author.tag, message.guild!.id, reason);
  },
};
