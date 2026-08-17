import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  Message,
} from 'discord.js';
import { Emojis } from '../../utils/emojis.js';

export interface SayEmbedConfig {
  channelId?: string;
  content: string;
  title: string;
  description: string;
  color: string;
  footer: string;
  image?: string;
  thumbnail?: string;
  reactions: string[];
}

export const sayEmbedSessions = new Map<string, SayEmbedConfig>();

const SAY_EMBED_SESSION_TTL_MS = 5 * 60 * 1000;
const sayEmbedSessionTimers = new Map<string, NodeJS.Timeout>();

export function startSayEmbedSession(userId: string, config: SayEmbedConfig): void {
  const previousTimer = sayEmbedSessionTimers.get(userId);
  if (previousTimer) clearTimeout(previousTimer);

  sayEmbedSessions.set(userId, config);
  const timer = setTimeout(() => {
    sayEmbedSessions.delete(userId);
    sayEmbedSessionTimers.delete(userId);
  }, SAY_EMBED_SESSION_TTL_MS);
  timer.unref?.();
  sayEmbedSessionTimers.set(userId, timer);
}

export function clearSayEmbedSession(userId: string): void {
  const timer = sayEmbedSessionTimers.get(userId);
  if (timer) clearTimeout(timer);
  sayEmbedSessionTimers.delete(userId);
  sayEmbedSessions.delete(userId);
}

function preview(value: string, maxLength: number): string {
  const sanitized = value.replace(/[`\n\r]/g, ' ').trim();
  return sanitized.length > maxLength ? `${sanitized.slice(0, maxLength - 1)}…` : sanitized;
}

export function getSayEmbedPanel(config: SayEmbedConfig) {
  const embed = new EmbedBuilder()
    .setColor(0xff3b69)
    .setTitle(`${Emojis.social || '🌸'} Construtor de Anúncios`)
    .setDescription(
      `Configure o anúncio pelos campos abaixo e envie somente quando a prévia estiver correta.\n\n` +
      `${Emojis.seta || '➜'} **Mensagem:** ${preview(config.content, 80)}\n` +
      `${Emojis.seta || '➜'} **Canal:** ${config.channelId ? `<#${config.channelId}>` : 'Canal atual'}\n` +
      `${Emojis.seta || '➜'} **Título:** ${preview(config.title, 60)}\n` +
      `${Emojis.seta || '➜'} **Descrição:** ${preview(config.description, 80)}\n` +
      `${Emojis.seta || '➜'} **Cor:** \`${config.color}\`\n` +
      `${Emojis.seta || '➜'} **Imagem:** ${config.image ? 'Definida' : 'Não definida'} · **Thumbnail:** ${config.thumbnail ? 'Definida' : 'Não definida'}\n` +
      `${Emojis.seta || '➜'} **Reações:** ${config.reactions.length ? config.reactions.join(' ') : 'Nenhuma'}`
    );

  const selectMenu = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('sayembed_menu')
      .setPlaceholder('Escolha o campo que deseja editar')
      .addOptions([
        { label: 'Mensagem', description: 'Texto enviado acima do embed', value: 'set_content', emoji: Emojis.utility || '📝' },
        { label: 'Canal', description: 'Canal onde o anúncio será enviado', value: 'set_channel', emoji: Emojis.utility || '📢' },
        { label: 'Título', description: 'Título principal do embed', value: 'set_title', emoji: Emojis.utility || '✏️' },
        { label: 'Descrição', description: 'Texto principal do embed', value: 'set_desc', emoji: Emojis.utility || '📄' },
        { label: 'Cor', description: 'Cor HEX do embed', value: 'set_color', emoji: Emojis.social || '🎨' },
        { label: 'Imagem', description: 'URL da imagem grande', value: 'set_image', emoji: Emojis.social || '🖼️' },
        { label: 'Thumbnail', description: 'URL da miniatura', value: 'set_thumbnail', emoji: Emojis.social || '🖼️' },
        { label: 'Rodapé', description: 'Texto exibido no rodapé', value: 'set_footer', emoji: Emojis.seta || '📌' },
        { label: 'Reação', description: 'Emoji adicionado após o envio', value: 'add_reaction', emoji: Emojis.check || '⭐' },
      ])
  );

  const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('sayembed_send')
      .setLabel('Enviar anúncio')
      .setStyle(ButtonStyle.Success)
      .setEmoji(Emojis.check || '✅'),
    new ButtonBuilder()
      .setCustomId('sayembed_cancel')
      .setLabel('Cancelar')
      .setStyle(ButtonStyle.Danger)
      .setEmoji(Emojis.ban || '❌')
  );

  return { embeds: [embed], components: [selectMenu, buttons] };
}

export default {
  data: new SlashCommandBuilder()
    .setName('sayembed')
    .setDescription('Construtor interativo de anúncios personalizados.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  deferEphemeral: true,

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.member || !(interaction.member as any).permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.editReply({ content: `${Emojis.ban} Você precisa ser **Administrador** para usar este comando, Darling!` });
    }

    const config: SayEmbedConfig = {
      content: 'Anúncio oficial',
      title: 'Anúncio da Administração',
      description: 'Clique nas opções abaixo para configurar este anúncio.',
      color: '#ff3b69',
      footer: `Criado por ${interaction.user.tag}`,
      reactions: [],
    };
    startSayEmbedSession(interaction.user.id, config);
    await interaction.editReply({ ...getSayEmbedPanel(config) });
  },

  async executeText(message: Message) {
    if (!message.member?.permissions.has(PermissionFlagsBits.Administrator)) {
      return message.reply({ content: `${Emojis.ban} Você precisa ser **Administrador** para usar este comando!` });
    }

    const config: SayEmbedConfig = {
      content: 'Anúncio oficial',
      title: 'Anúncio da Administração',
      description: 'Clique nas opções abaixo para configurar este anúncio.',
      color: '#ff3b69',
      footer: `Criado por ${message.author.tag}`,
      reactions: [],
    };
    startSayEmbedSession(message.author.id, config);
    await message.reply(getSayEmbedPanel(config));
  },
};
