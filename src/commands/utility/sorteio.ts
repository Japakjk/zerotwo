import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType, ButtonBuilder, ButtonStyle, ComponentType, ModalBuilder, TextInputBuilder, TextInputStyle, Message } from 'discord.js';
import { Emojis } from '../../utils/emojis.js';
import { ZeroTwoEmbed } from '../../utils/embeds.js';
import { GiveawayModel } from '../../database/models/Giveaway.js';
import ms from 'ms';

function isSafeHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

function validationError(field: string, value: string): string | null {
  const text = value.trim();
  if (field === 'prize' && (text.length < 1 || text.length > 200)) return 'O prêmio deve ter entre 1 e 200 caracteres.';
  if (field === 'title' && text.length > 256) return 'O título pode ter no máximo 256 caracteres.';
  if (field === 'winners' && (!/^\d+$/.test(text) || Number(text) < 1 || Number(text) > 20)) return 'A quantidade de ganhadores deve ser um número entre 1 e 20.';
  if (field === 'duration') {
    const durationMs = ms(text);
    if (!durationMs || durationMs < 60_000 || durationMs > 30 * 24 * 60 * 60 * 1000) return 'A duração deve estar entre 1 minuto e 30 dias.';
  }
  if (field === 'color' && !/^#[0-9a-f]{6}$/i.test(text)) return 'A cor deve estar no formato HEX, por exemplo: `#ff3b69`.';
  if (field === 'image' && text && !isSafeHttpUrl(text)) return 'Informe uma URL HTTP ou HTTPS válida.';
  if (field === 'emoji' && (text.length < 1 || text.length > 100 || /\s/.test(text))) return 'Informe um emoji válido, sem espaços.';
  return null;
}

interface GiveawayDraft {
  channelId?: string;
  prize?: string;
  title?: string;
  winnerCount: number;
  duration?: string;
  durationMs?: number;
  color: string;
  image?: string;
  buttonEmoji: string;
  requiredRoles: string[];
  minAccountAgeDays: number;
}

export default {
  data: new SlashCommandBuilder()
    .setName('sorteio')
    .setDescription('Crie um sorteio profissional e interativo no Garden')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  deferEphemeral: true,

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.member || !(interaction.member as any).permissions.has(PermissionFlagsBits.ManageGuild)) {
      return interaction.editReply({ embeds: [ZeroTwoEmbed.permissionError('ManageGuild')] });
    }
    await this.startCreator(interaction, interaction.user, interaction.guildId!);
  },

  async executeText(message: Message, args: string[]) {
    if (!message.member?.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return message.reply({ content: `${Emojis.warning} Você precisa ter permissão de **Gerenciar Servidor** para criar sorteios, Darling!` });
    }
    await this.startCreator(message, message.author, message.guildId!);
  },

  async startCreator(context: ChatInputCommandInteraction | Message, author: any, guildId: string) {
    const isInteraction = context instanceof ChatInputCommandInteraction;

    const draft: GiveawayDraft = {
      winnerCount: 1,
      color: '#ff3b69',
      buttonEmoji: '🎁',
      requiredRoles: [],
      minAccountAgeDays: 0
    };

    const renderPanel = () => {
      return new EmbedBuilder()
        .setColor(0xff3b69)
        .setTitle(`🌸 **Criador de Sorteios da Zero Two**`)
        .setDescription(
          `• Bem-vindo(a) ao painel de criação de sorteios, Darling!\n` +
          `• Use o menu abaixo para configurar as opções do seu sorteio.\n\n` +
          `• 🛠️ **Informações atuais:**\n` +
          `  ◦ Canal onde o sorteio será criado: ${draft.channelId ? `<#${draft.channelId}>` : '`Não definido`'}\n` +
          `  ◦ Prêmio: \`${draft.prize || 'Não definido'}\`\n` +
          `  ◦ Título: \`${draft.title || 'SORTEIO DA ZERO TWO'}\`\n` +
          `  ◦ Quantidade de ganhadores: \`${draft.winnerCount}\`\n` +
          `  ◦ Duração: \`${draft.duration || 'Não definido'}\`\n` +
          `  ◦ Cor: \`${draft.color}\`\n` +
          `  ◦ Imagem: \`${draft.image ? 'Definida' : 'Nenhuma'}\`\n` +
          `  ◦ Emoji do botão de participar: ${draft.buttonEmoji}\n` +
          `  ◦ Cargos necessários: ${draft.requiredRoles.length > 0 ? draft.requiredRoles.map(r => `<@&${r}>`).join(', ') : '`Nenhum`'}\n` +
          `  ◦ Dias de conta necessários: \`${draft.minAccountAgeDays} dias\`\n\n` +
          `👉 *Clique em "Lançar Sorteio" quando terminar a configuração!*`
        )
        .setFooter({ text: `Sorteio iniciado por: ${author.username}` })
        .setTimestamp();
    };

    const getComponents = () => {
      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('giveaway_menu')
        .setPlaceholder('🌸 Selecione uma opção para configurar o sorteio')
        .addOptions([
          { label: 'Definir Canal', description: 'Canal onde o sorteio será criado', value: 'set_channel', emoji: '💬' },
          { label: 'Definir Prêmio', description: 'Texto do prêmio do sorteio', value: 'set_prize', emoji: '🎁' },
          { label: 'Definir Título', description: 'Título do embed (opcional)', value: 'set_title', emoji: '✏️' },
          { label: 'Ganhadores', description: 'Quantidade de ganhadores', value: 'set_winners', emoji: '🏆' },
          { label: 'Definir Duração', description: 'Tempo até terminar (ex: 10m, 2h, 1d)', value: 'set_duration', emoji: '⏱️' },
          { label: 'Alterar Cor', description: 'Cor do embed (HEX)', value: 'set_color', emoji: '🎨' },
          { label: 'Definir Imagem', description: 'Imagem do embed (URL)', value: 'set_image', emoji: '🖼️' },
          { label: 'Emoji do Botão', description: 'Emoji do botão Participar', value: 'set_emoji', emoji: '😀' },
        ]);

      const actionRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

      const buttonsRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId('launch_giveaway')
          .setLabel('Lançar Sorteio')
          .setStyle(ButtonStyle.Success)
          .setEmoji('✅'),
        new ButtonBuilder()
          .setCustomId('cancel_giveaway')
          .setLabel('Cancelar')
          .setStyle(ButtonStyle.Danger)
          .setEmoji('❌')
      );

      return [actionRow, buttonsRow];
    };

    const response = isInteraction
      ? await context.editReply({ embeds: [renderPanel()], components: getComponents() })
      : await context.reply({ embeds: [renderPanel()], components: getComponents() });

    const collector = response.createMessageComponentCollector({
      time: 300000,
      filter: (i: any) => i.isStringSelectMenu() || i.isChannelSelectMenu() || i.isButton(),
    });

    collector.on('collect', async i => {
      if (i.user.id !== author.id) {
        await i.reply({ content: `${Emojis.warning} Apenas o Darling **${author.username}** pode configurar este sorteio!`, ephemeral: true });
        return;
      }

      if (i.isChannelSelectMenu() && i.customId === 'giveaway_channel_select') {
        const selectedChannel = i.channels.first();
        const selected = selectedChannel as { id?: string; type?: number; isTextBased?: () => boolean } | undefined;
        const isTextBasedChannel = selected && (
          typeof selected.isTextBased === 'function'
            ? selected.isTextBased()
            : [ChannelType.GuildText, ChannelType.GuildAnnouncement, ChannelType.GuildForum].includes(selected.type as ChannelType)
        );
        if (!selected?.id || !isTextBasedChannel) {
          await i.reply({ embeds: [ZeroTwoEmbed.warning('Canal inválido', 'Selecione um canal de texto válido para publicar o sorteio.')], ephemeral: true });
          return;
        }
        draft.channelId = selected.id;
        await i.update({ embeds: [renderPanel()], components: getComponents() });
        return;
      }

      if (i.isStringSelectMenu()) {
        const val = i.values[0];

        if (val === 'set_channel') {
          const channelSelect = new ChannelSelectMenuBuilder()
            .setCustomId('giveaway_channel_select')
            .setPlaceholder('Selecione o canal do sorteio')
            .setMinValues(1)
            .setMaxValues(1)
            .setChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement, ChannelType.GuildForum);
          await i.update({
            embeds: [new EmbedBuilder().setColor(0xff3b69).setTitle(`${Emojis.seta} Selecionar canal`).setDescription('Escolha o canal onde o sorteio será publicado.')],
            components: [new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(channelSelect)],
          });
          return;
        } else if (val === 'set_prize') {
          const modal = new ModalBuilder().setCustomId('modal_giveaway_prize').setTitle('Definir Prêmio');
          const input = new TextInputBuilder().setCustomId('input_prize').setLabel('Qual é o prêmio?').setStyle(TextInputStyle.Short).setRequired(true);
          modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(input));
          await i.showModal(modal);
        } else if (val === 'set_title') {
          const modal = new ModalBuilder().setCustomId('modal_giveaway_title').setTitle('Definir Título');
          const input = new TextInputBuilder().setCustomId('input_title').setLabel('Título do Sorteio').setStyle(TextInputStyle.Short).setRequired(false);
          modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(input));
          await i.showModal(modal);
        } else if (val === 'set_winners') {
          const modal = new ModalBuilder().setCustomId('modal_giveaway_winners').setTitle('Quantidade de Ganhadores');
          const input = new TextInputBuilder().setCustomId('input_winners').setLabel('Número de vencedores (ex: 1, 3)').setStyle(TextInputStyle.Short).setRequired(true);
          modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(input));
          await i.showModal(modal);
        } else if (val === 'set_duration') {
          const modal = new ModalBuilder().setCustomId('modal_giveaway_duration').setTitle('Definir Duração');
          const input = new TextInputBuilder().setCustomId('input_duration').setLabel('Duração (ex: 30m, 2h, 1d)').setStyle(TextInputStyle.Short).setRequired(true);
          modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(input));
          await i.showModal(modal);
        } else if (val === 'set_color') {
          const modal = new ModalBuilder().setCustomId('modal_giveaway_color').setTitle('Cor do Embed');
          const input = new TextInputBuilder().setCustomId('input_color').setLabel('Código HEX (ex: #ff3b69)').setStyle(TextInputStyle.Short).setRequired(true);
          modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(input));
          await i.showModal(modal);
        } else if (val === 'set_image') {
          const modal = new ModalBuilder().setCustomId('modal_giveaway_image').setTitle('Imagem do Sorteio');
          const input = new TextInputBuilder().setCustomId('input_image').setLabel('URL da imagem').setStyle(TextInputStyle.Short).setRequired(true);
          modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(input));
          await i.showModal(modal);
        } else if (val === 'set_emoji') {
          const modal = new ModalBuilder().setCustomId('modal_giveaway_emoji').setTitle('Emoji do Botão');
          const input = new TextInputBuilder().setCustomId('input_emoji').setLabel('Emoji (ex: 🎁 ou ID)').setStyle(TextInputStyle.Short).setRequired(true);
          modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(input));
          await i.showModal(modal);
        }

        // Tratar submissão de modais
        try {
          const modalInteraction = await i.awaitModalSubmit({
            time: 300000,
            filter: mi => mi.user.id === author.id
          });

          const fieldMap: Record<string, { field: string; input: string }> = {
            modal_giveaway_prize: { field: 'prize', input: 'input_prize' },
            modal_giveaway_title: { field: 'title', input: 'input_title' },
            modal_giveaway_winners: { field: 'winners', input: 'input_winners' },
            modal_giveaway_duration: { field: 'duration', input: 'input_duration' },
            modal_giveaway_color: { field: 'color', input: 'input_color' },
            modal_giveaway_image: { field: 'image', input: 'input_image' },
            modal_giveaway_emoji: { field: 'emoji', input: 'input_emoji' },
          };
          const mapping = fieldMap[modalInteraction.customId];
          if (mapping) {
            const raw = modalInteraction.fields.getTextInputValue(mapping.input).trim().replace(/<#|>/g, '');
            const error = validationError(mapping.field, raw);
            if (error) {
              await modalInteraction.reply({ embeds: [ZeroTwoEmbed.warning('Valor inválido', error)], ephemeral: true });
            } else {
              if (mapping.field === 'prize') draft.prize = raw;
              if (mapping.field === 'title') draft.title = raw || 'SORTEIO DA ZERO TWO';
              if (mapping.field === 'winners') draft.winnerCount = Number(raw);
              if (mapping.field === 'duration') { draft.duration = raw; draft.durationMs = ms(raw) || undefined; }
              if (mapping.field === 'color') draft.color = raw;
              if (mapping.field === 'image') draft.image = raw || undefined;
              if (mapping.field === 'emoji') draft.buttonEmoji = raw;
              await modalInteraction.reply({ content: `${Emojis.check} Configuração atualizada, Darling!`, ephemeral: true });
              await response.edit({ embeds: [renderPanel()], components: getComponents() });
            }
          }
        } catch {
          await response.edit({
            embeds: [ZeroTwoEmbed.info('Modal expirado', 'O formulário expirou sem salvar alterações. Abra uma opção novamente para continuar.')],
            components: getComponents(),
          }).catch(() => {});
        }
      }

      if (i.isButton()) {
          if (i.customId === 'cancel_giveaway') {
            await i.update({ content: `${Emojis.ban} Sorteio cancelado. Nenhum dado foi publicado.`, embeds: [], components: [] });
            collector.stop('completed');
          return;
        }

        if (i.customId === 'launch_giveaway') {
          if (!draft.channelId || !draft.prize || !draft.durationMs) {
            await i.reply({ content: `${Emojis.warning} Darling, você precisa definir pelo menos o **Canal**, o **Prêmio** e a **Duração** antes de lançar!`, ephemeral: true });
            return;
          }

          const targetChannel = await i.guild?.channels.fetch(draft.channelId).catch(() => null);
          if (!targetChannel || !targetChannel.isTextBased()) {
            await i.reply({ embeds: [ZeroTwoEmbed.warning('Canal inválido', 'Escolha um canal de texto existente no servidor.')], ephemeral: true });
            return;
          }
          const botMember = i.guild?.members.me;
          if (botMember && !targetChannel.permissionsFor(botMember)?.has(['SendMessages', 'EmbedLinks'])) {
            await i.reply({ embeds: [ZeroTwoEmbed.permissionError('SendMessages e EmbedLinks no canal escolhido')], ephemeral: true });
            return;
          }

          const endsAt = new Date(Date.now() + draft.durationMs);

          const giveawayEmbed = new EmbedBuilder()
            .setColor(draft.color as any || 0xff3b69)
            .setTitle(`${Emojis.achievement} **${draft.title || 'SORTEIO DA ZERO TWO'}** ${Emojis.achievement}`)
            .setDescription(
              `🎁 **Prêmio:** \`${draft.prize}\`\n` +
              `🏆 **Ganhadores:** \`${draft.winnerCount}\`\n` +
              `⏳ **Termina em:** <t:${Math.floor(endsAt.getTime() / 1000)}:R>\n` +
              `👤 **Organizado por:** ${author}\n\n` +
              `👉 *Clique em ${draft.buttonEmoji} abaixo para participar!*`
            )
            .setFooter({ text: 'Darling in the Franxx - Sorteios' })
            .setTimestamp();

          if (draft.image) giveawayEmbed.setImage(draft.image);

          const joinButton = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
              .setCustomId('join_giveaway')
              .setLabel('Participar')
              .setStyle(ButtonStyle.Primary)
              .setEmoji(draft.buttonEmoji)
          );

          const giveawayMessage = await targetChannel.send({ embeds: [giveawayEmbed], components: [joinButton] });

          await GiveawayModel.create({
            guildId,
            channelId: targetChannel.id,
            messageId: giveawayMessage.id,
            prize: draft.prize,
            title: draft.title,
            endsAt,
            winnerCount: draft.winnerCount,
            hostId: author.id,
            status: 'active',
            color: draft.color,
            image: draft.image,
            buttonEmoji: draft.buttonEmoji,
            participants: [],
          });

          await i.update({ content: `${Emojis.check} Sorteio lançado com sucesso em ${targetChannel}!`, embeds: [], components: [] });
          collector.stop('completed');
        }
      }
    });

    collector.on('end', async (_collected: any, reason: string) => {
      if (reason === 'time') {
        await response.edit({
          embeds: [ZeroTwoEmbed.info('Criador expirado', 'O painel de sorteio expirou sem publicar nada. Execute **/sorteio** novamente para começar.')],
          components: [],
        }).catch(() => {});
      }
    });
  }
};
