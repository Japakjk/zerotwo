import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ChannelSelectMenuBuilder, Message, ChannelType, ComponentType } from 'discord.js';
import { Emojis } from '../../utils/emojis.js';
import { GuildModel } from '../../database/models/Guild.js';

export default {
  data: new SlashCommandBuilder()
    .setName('zlogs')
    .setDescription('Configure o sistema de registros e logs da Loirinha')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  deferEphemeral: true,

  async execute(interaction: ChatInputCommandInteraction) {
    await this.startLogsPanel(interaction, interaction.user, interaction.guildId!);
  },

  async executeText(message: Message, args: string[]) {
    if (!message.member?.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return message.reply({ content: `${Emojis.warning} Você precisa ter permissão de **Gerenciar Servidor** para configurar os logs, Darling!` });
    }
    await this.startLogsPanel(message, message.author, message.guildId!);
  },

  async startLogsPanel(context: ChatInputCommandInteraction | Message, author: any, guildId: string) {
    const isInteraction = context instanceof ChatInputCommandInteraction;

    let guildDb = await GuildModel.findOne({ guildId });
    if (!guildDb) {
      guildDb = await GuildModel.create({ guildId });
    }

    const renderPanel = () => {
      const statusText = guildDb?.logsEnabled ? '`Ativado` ✅' : '`Desativado` ❌';
      const getChan = (id?: string) => id ? `<#${id}>` : '`Não definido`';

      return new EmbedBuilder()
        .setColor(0xff3b69)
        .setTitle(`🌸 **Logs | Zero Two**`)
        .setDescription(
          `• Bem-vindo(a) ao sistema de registros/logs da Zero Two!\n` +
          `• Aqui você pode configurar os canais onde a Zero Two irá registrar eventos que acontecem no seu servidor (Bans, Manipulação de cargos e canais, Mensagens editadas e apagadas, etc.). Utilize o menu abaixo para configurar.\n\n` +
          `• 🛠️ **Informações sobre o sistema:**\n` +
          `  ◦ Status: ${statusText}\n` +
          `• 📂 **Canais definidos:**\n` +
          `  ◦ Entrada: ${getChan(guildDb?.logChannels?.join)}\n` +
          `  ◦ Saída: ${getChan(guildDb?.logChannels?.leave)}\n` +
          `  ◦ Mensagem: ${getChan(guildDb?.logChannels?.messages)}\n` +
          `  ◦ Voz: ${getChan(guildDb?.logChannels?.voice)}\n` +
          `  ◦ Bans: ${getChan(guildDb?.logChannels?.bans)}\n` +
          `  ◦ Adicionar/Remover Cargos: ${getChan(guildDb?.logChannels?.rolesAddRemove)}\n` +
          `  ◦ Criar/Deletar/Editar Cargos: ${getChan(guildDb?.logChannels?.rolesCreateEdit)}\n` +
          `  ◦ Criar/Deletar/Editar Canais: ${getChan(guildDb?.logChannels?.channelsCreateEdit)}\n\n` +
          `👉 *Selecione uma opção no menu abaixo para configurar.*`
        )
        .setFooter({ text: 'Darling in the Franxx - Sistema de Logs' })
        .setTimestamp();
    };

    const getComponents = () => {
      const isEnabled = guildDb?.logsEnabled;
      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('zlogs_menu')
        .setPlaceholder('🌸 Selecione a opção desejada para configurar.')
        .addOptions([
          {
            label: isEnabled ? 'Desativar Logs' : 'Ativar Logs',
            description: isEnabled ? 'Desative o sistema de logs' : 'Ative o sistema de logs',
            value: isEnabled ? 'disable_logs' : 'enable_logs',
            emoji: isEnabled ? '❌' : '🟢'
          },
          { label: 'Criar canais automaticamente (Recomendado)', description: 'A Zero Two criará e configurará tudo sozinha', value: 'auto_setup', emoji: '⚙️' },
          { label: 'Definir Entrada', description: 'Canal de entrada de membros', value: 'set_join', emoji: '📥' },
          { label: 'Definir Saída', description: 'Canal de saída de membros', value: 'set_leave', emoji: '📤' },
          { label: 'Definir Mensagens', description: 'Canal de mensagens editadas/apagadas', value: 'set_messages', emoji: '💬' },
          { label: 'Definir Canais de Voz', description: 'Canal de movimentação em voz', value: 'set_voice', emoji: '🔊' },
          { label: 'Definir Bans', description: 'Canal de banimentos', value: 'set_bans', emoji: '🔨' },
          { label: 'Definir Cargos (Add/Remove)', description: 'Log de cargos adicionados/removidos', value: 'set_roles_add', emoji: '🛡️' },
          { label: 'Definir Criação/Edição de Cargos', description: 'Log de cargos criados, editados ou removidos', value: 'set_roles_create', emoji: '🛠️' },
          { label: 'Definir Criação/Edição de Canais', description: 'Log de canais criados, editados ou removidos', value: 'set_channels_create', emoji: '📁' },
        ]);

      return [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu)];
    };

    const response = isInteraction
      ? await context.editReply({ embeds: [renderPanel()], components: getComponents() })
      : await context.reply({ embeds: [renderPanel()], components: getComponents() });

    const collector = response.createMessageComponentCollector({ time: 300000 });

    collector.on('collect', async i => {
      if (i.user.id !== author.id) {
        await i.reply({ content: `${Emojis.warning} Apenas o Darling **${author.username}** pode configurar os logs!`, ephemeral: true });
        return;
      }

      if (i.isStringSelectMenu()) {
        const val = i.values[0];

        if (val === 'enable_logs') {
          guildDb!.logsEnabled = true;
          await guildDb!.save();
          await i.update({ embeds: [renderPanel()], components: getComponents() });
        } else if (val === 'disable_logs') {
          guildDb!.logsEnabled = false;
          await guildDb!.save();
          await i.update({ embeds: [renderPanel()], components: getComponents() });
        } else if (val === 'auto_setup') {
          await i.deferUpdate();
          const guild = i.guild!;
          
          // Criar categoria e canais
          const category = await guild.channels.create({
            name: '🌸 ZERO TWO LOGS',
            type: ChannelType.GuildCategory
          });

          const joinChan = await guild.channels.create({ name: '📥-entrada', type: ChannelType.GuildText, parent: category.id });
          const leaveChan = await guild.channels.create({ name: '📤-saida', type: ChannelType.GuildText, parent: category.id });
          const msgChan = await guild.channels.create({ name: '💬-mensagens', type: ChannelType.GuildText, parent: category.id });
          const voiceChan = await guild.channels.create({ name: '🔊-voz', type: ChannelType.GuildText, parent: category.id });
          const banChan = await guild.channels.create({ name: '🔨-bans', type: ChannelType.GuildText, parent: category.id });
          const roleChan = await guild.channels.create({ name: '🛡️-cargos', type: ChannelType.GuildText, parent: category.id });

          guildDb!.logsEnabled = true;
          guildDb!.logChannels = {
            join: joinChan.id,
            leave: leaveChan.id,
            messages: msgChan.id,
            voice: voiceChan.id,
            bans: banChan.id,
            rolesAddRemove: roleChan.id,
            rolesCreateEdit: roleChan.id,
            channelsCreateEdit: msgChan.id
          };
          await guildDb!.save();

          await response.edit({ embeds: [renderPanel()], components: getComponents() });
          await i.followUp({ content: `${Emojis.check} Canais de log criados e configurados automaticamente com sucesso, Darling!`, ephemeral: true });
        } else {
          const channelKeyByOption: Record<string, string> = {
            set_join: 'join',
            set_leave: 'leave',
            set_messages: 'messages',
            set_voice: 'voice',
            set_bans: 'bans',
            set_roles_add: 'rolesAddRemove',
            set_roles_create: 'rolesCreateEdit',
            set_channels_create: 'channelsCreateEdit',
          };
          const channelKey = channelKeyByOption[val];
          if (!channelKey) return;

          const selectorId = `zlogs_channel_${channelKey}`;
          const channelResponse = await i.reply({
            content: `${Emojis.seta} Selecione o canal de texto para este tipo de log.`,
            components: [new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
              new ChannelSelectMenuBuilder()
                .setCustomId(selectorId)
                .setPlaceholder('Escolha um canal de texto')
                .setChannelTypes([ChannelType.GuildText])
                .setMinValues(1)
                .setMaxValues(1)
            )],
            ephemeral: true,
            fetchReply: true,
          });

          const channelCollector = channelResponse.createMessageComponentCollector({
            componentType: ComponentType.ChannelSelect,
            time: 300000,
            filter: component => component.customId === selectorId,
          });

          channelCollector.on('collect', async channelInteraction => {
            if (channelInteraction.user.id !== author.id) {
              await channelInteraction.reply({ content: `${Emojis.warning} Apenas **${author.username}** pode escolher o canal deste painel.`, ephemeral: true });
              return;
            }

            const selectedChannel = channelInteraction.channels.first();
            if (!selectedChannel) {
              await channelInteraction.reply({ content: `${Emojis.warning} Nenhum canal válido foi selecionado.`, ephemeral: true });
              return;
            }

            guildDb!.logChannels = { ...(guildDb!.logChannels || {}), [channelKey]: selectedChannel.id };
            await guildDb!.save();
            await channelInteraction.update({ content: `${Emojis.check} Canal ${selectedChannel} definido para este tipo de log.`, components: [] });
            await response.edit({ embeds: [renderPanel()], components: getComponents() }).catch(() => {});
            channelCollector.stop('completed');
          });

          channelCollector.on('end', async (_collected, reason) => {
            if (reason === 'time') {
              await channelResponse.edit({ content: `${Emojis.warning} O seletor de canal expirou. Abra **/zlogs** novamente para tentar.`, components: [] }).catch(() => {});
            }
          });
        }
      }
    });
  }
};
