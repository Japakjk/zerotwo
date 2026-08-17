import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuInteraction,
  ComponentType,
  Message,
  AutocompleteInteraction,
} from 'discord.js';
import { ZeroTwoEmbed } from '../../utils/embeds.js';
import { Emojis } from '../../utils/emojis.js';
import { GuildModel } from '../../database/models/Guild.js';
import { config } from '../../config/config.js';

const categories = [
  { name: 'Economia', value: 'economy', emoji: Emojis.economy || '💰', description: 'D-Coins, trabalho, banco e jogos.' },
  { name: 'Utilidades', value: 'utility', emoji: Emojis.utility || '✨', description: 'Ajuda, configurações, lembretes e informações.' },
  { name: 'Interação', value: 'social', emoji: Emojis.social || '💖', description: 'Comandos sociais e relacionamentos.' },
  { name: 'Moderação', value: 'moderation', emoji: Emojis.moderation || '🛡️', description: 'Punições, canais e histórico de moderação.' },
  { name: 'Administração', value: 'admin', emoji: Emojis.admin || '⚙️', description: 'Owner, configuração e ferramentas administrativas.' },
];

const categoryFolders: Record<string, string[]> = {
  economy: ['economy', 'games'],
  utility: ['utility'],
  social: ['social'],
  moderation: ['moderation'],
  admin: ['owner'],
};

function getCommandName(command: any): string {
  return command?.data?.name || command?.name || '';
}

export default {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Exibe o painel de ajuda e os comandos disponíveis da Loirinha.')
    .addStringOption(opt =>
      opt.setName('categoria')
        .setDescription('Escolha uma categoria específica')
        .setRequired(false)
        .setAutocomplete(true)
    ),
  deferEphemeral: true,

  async autocomplete(interaction: AutocompleteInteraction) {
    const focusedValue = interaction.options.getFocused().toLowerCase();
    const filtered = categories
      .filter(choice => choice.name.toLowerCase().includes(focusedValue) || choice.value.includes(focusedValue))
      .slice(0, 25);

    await interaction.respond(filtered.map(choice => ({ name: choice.name, value: choice.value })));
  },

  async execute(interaction: ChatInputCommandInteraction) {
    const category = interaction.options.getString('categoria');
    if (category) {
      await this.sendCategoryEmbed(interaction, category);
    } else {
      await this.sendHelpPanel(interaction);
    }
  },

  async executeText(message: Message, args: string[]) {
    const category = args[0]?.toLowerCase();
    const found = categories.find(c => c.value === category || c.name.toLowerCase() === category);

    if (found) {
      await this.sendCategoryEmbed(message, found.value);
    } else {
      await this.sendHelpPanel(message);
    }
  },

  async getPrefix(context: ChatInputCommandInteraction | Message): Promise<string> {
    const guildId = context.guildId || context.guild?.id;
    if (!guildId) return config.DEFAULT_PREFIX;

    try {
      const guildDb = await GuildModel.findOne({ guildId });
      return guildDb?.prefix || config.DEFAULT_PREFIX;
    } catch {
      return config.DEFAULT_PREFIX;
    }
  },

  async sendHelpPanel(context: ChatInputCommandInteraction | Message) {
    const isInteraction = context instanceof ChatInputCommandInteraction;
    const user = isInteraction ? context.user : context.author;
    const prefix = await this.getPrefix(context);

    const embed = new ZeroTwoEmbed()
      .setTitle(`${Emojis.social || '🌸'} Painel de Ajuda | Zero Two`)
      .setDescription(
        `Olá **Darling ${user.username}**! Este é o painel oficial de comandos.\n\n` +
        `Prefixos ativos: **\`/\`** e **\`${prefix}\`**.\n\n` +
        `${Emojis.seta || '➜'} Selecione uma categoria para consultar somente os comandos realmente carregados pelo bot.`
      )
      .setThumbnail(context.client.user?.displayAvatarURL() || null);

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('help_category')
        .setPlaceholder('Selecione uma categoria...')
        .addOptions(categories.map(c => ({
          label: c.name,
          description: c.description,
          value: c.value,
          emoji: c.emoji,
        })))
    );

    const response = isInteraction
      ? await context.editReply({ embeds: [embed], components: [row] })
      : await context.reply({ embeds: [embed], components: [row] });

    const collector = response.createMessageComponentCollector({
      componentType: ComponentType.StringSelect,
      time: 180000,
      filter: i => i.isStringSelectMenu(),
    });

    collector.on('collect', async (i: StringSelectMenuInteraction) => {
      if (i.user.id !== user.id) {
        await i.reply({
          embeds: [ZeroTwoEmbed.warning('Painel reservado', 'Este painel pertence a quem executou o comando. Execute **/help** para abrir o seu próprio painel.')],
          ephemeral: true,
        });
        return;
      }

      await this.sendCategoryEmbed(i, i.values[0], true);
    });

    collector.on('end', async () => {
      const expiredEmbed = ZeroTwoEmbed.info(
        'Painel expirado',
        'Este painel de ajuda expirou. Execute **/help** novamente para consultar os comandos atuais.'
      ).setThumbnail(context.client.user?.displayAvatarURL() || null);
      await response.edit({ embeds: [expiredEmbed], components: [] }).catch(() => {});
    });
  },

  async sendCategoryEmbed(
    context: ChatInputCommandInteraction | Message | StringSelectMenuInteraction,
    category: string,
    isUpdate = false,
  ) {
    const categoryInfo = categories.find(c => c.value === category);
    const folders = categoryFolders[category];
    const commands = folders
      ? [...(context.client as any).commands.values()]
        .filter((command: any) => folders.includes(command.category))
        .sort((a: any, b: any) => getCommandName(a).localeCompare(getCommandName(b)))
      : [];

    const embed = new ZeroTwoEmbed()
      .setTitle(`${categoryInfo?.emoji || Emojis.utility || '🌸'} ${categoryInfo?.name || 'Categoria'}`)
      .setThumbnail(context.client.user?.displayAvatarURL() || null);

    if (commands.length === 0) {
      embed.setDescription(
        `${Emojis.warning || '⚠️'} Não encontrei comandos carregados nesta categoria.\n\n` +
        `${Emojis.seta || '➜'} Volte ao menu ou execute **/help** novamente.`
      );
    } else {
      const prefix = context.guildId
        ? await GuildModel.findOne({ guildId: context.guildId }).then((g: any) => g?.prefix || config.DEFAULT_PREFIX).catch(() => config.DEFAULT_PREFIX)
        : config.DEFAULT_PREFIX;
      const commandLines = commands.map((command: any) => {
        const name = getCommandName(command);
        const description = command.data?.description || 'Sem descrição disponível.';
        return `${Emojis.seta || '➜'} **/${name}** · **\`${prefix}${name}\`** — ${description}`;
      });

      embed.setDescription(
        `Prefixos: **\`/\`** e **\`${prefix}\`**.\n\n` +
        commandLines.join('\n')
      );
    }

    if (isUpdate && context instanceof StringSelectMenuInteraction) {
      await context.update({ embeds: [embed] });
    } else if (context instanceof ChatInputCommandInteraction) {
      await context.editReply({ embeds: [embed] });
    } else if (context instanceof Message) {
      await context.reply({ embeds: [embed] });
    }
  },
};
