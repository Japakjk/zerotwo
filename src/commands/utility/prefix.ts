import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, EmbedBuilder, Message } from 'discord.js';
import { GuildModel } from '../../database/models/Guild.js';
import { Emojis } from '../../utils/emojis.js';
import { config } from '../../config/config.js';

export default {
  data: new SlashCommandBuilder()
    .setName('prefixo')
    .setDescription('Altere ou consulte o prefixo do bot no servidor')
    .addStringOption(option =>
      option.setName('novo')
        .setDescription('O novo prefixo desejado (ex: z!, ?)')
        .setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction: ChatInputCommandInteraction) {
    const newPrefix = interaction.options.getString('novo') || undefined;
    const guildId = interaction.guildId!;
    await this.handlePrefix(interaction, newPrefix, guildId, true);
  },

  async executeText(message: Message, args: string[]) {
    const newPrefix = args[0] || undefined;
    const guildId = message.guild!.id;

    if (!message.member?.permissions.has(PermissionFlagsBits.ManageGuild)) {
      await message.reply({ content: `${Emojis.warning} Você precisa ter permissão de **Gerenciar Servidor** para alterar o prefixo, Darling!` });
      return;
    }

    await this.handlePrefix(message, newPrefix, guildId, false);
  },

  async handlePrefix(context: ChatInputCommandInteraction | Message, newPrefix: string | undefined, guildId: string, isInteraction: boolean) {
    let guildData = await GuildModel.findOne({ guildId });
    if (!guildData) {
      guildData = new GuildModel({ guildId, prefix: config.DEFAULT_PREFIX });
    }

    if (!newPrefix) {
      const embed = new EmbedBuilder()
        .setColor(0xff3b69)
        .setTitle(`✨ **Prefixo do Servidor**`)
        .setDescription(`O prefixo atual da **Zero Two** neste servidor é: \`${guildData.prefix}\`\nVocê também pode usar comandos por barra \`/\` ou \`${config.DEFAULT_PREFIX}\`.`);

      if (isInteraction) {
        await (context as ChatInputCommandInteraction).editReply({ embeds: [embed] });
      } else {
        await (context as Message).reply({ embeds: [embed] });
      }
      return;
    }

    guildData.prefix = newPrefix;
    await guildData.save();

    const embed = new EmbedBuilder()
      .setColor(0xff3b69)
      .setTitle(`${Emojis.check} **Prefixo Alterado**`)
      .setDescription(`O prefixo do servidor foi alterado com sucesso para: \`${newPrefix}\`\n\n*A Zero Two está pronta para receber suas ordens, Darling!*`);

    if (isInteraction) {
      await (context as ChatInputCommandInteraction).editReply({ embeds: [embed] });
    } else {
      await (context as Message).reply({ embeds: [embed] });
    }
  }
};
