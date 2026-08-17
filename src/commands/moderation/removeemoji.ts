import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, Message } from 'discord.js';
import { ZeroTwoEmbed } from '../../utils/embeds.js';
import { Emojis } from '../../utils/emojis.js';

export default {
  data: new SlashCommandBuilder()
    .setName('removeemoji')
    .setDescription('Remove um emoji do servidor.')
    .addStringOption(opt =>
      opt.setName('emoji')
        .setDescription('O emoji ou ID do emoji a ser removido')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageEmojisAndStickers),

  async execute(interaction: ChatInputCommandInteraction) {
    const emojiInput = interaction.options.getString('emoji', true);
    const guild = interaction.guild!;
    const match = emojiInput.match(/:(\d+)>$/) || emojiInput.match(/^(\d+)$/);
    const emojiId = match ? match[1] : null;

    const emoji = emojiId ? guild.emojis.cache.get(emojiId) : guild.emojis.cache.find(e => e.name === emojiInput);

    if (!emoji) {
      return interaction.editReply({
        embeds: [ZeroTwoEmbed.error('Emoji não encontrado', 'Não encontrei este emoji no servidor, **Darling**!')]
      });
    }

    const emojiName = emoji.name;
    try {
      await emoji.delete();
      const embed = new ZeroTwoEmbed()
        .setTitle(`${Emojis.check} Emoji Removido`)
        .setDescription(`${Emojis.seta} O emoji **:${emojiName}:** foi removido com sucesso do Garden.`);
      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('[removeemoji] falha ao remover emoji', { guildId: interaction.guildId, emojiId: emoji.id, emojiName, error });
      await interaction.editReply({
        embeds: [ZeroTwoEmbed.error('Emoji não removido', 'O Discord recusou a remoção. Confirme se eu ainda tenho `ManageEmojisAndStickers` neste servidor.')]
      });
    }
  },

  async executeText(message: Message, args: string[]) {
    if (!message.member?.permissions.has(PermissionFlagsBits.ManageEmojisAndStickers)) {
      return message.reply({ embeds: [ZeroTwoEmbed.permissionError('ManageEmojisAndStickers')] });
    }

    const emojiInput = args[0];
    if (!emojiInput) return message.reply({ content: 'Forneça o emoji ou ID para remover, Darling!' });

    const guild = message.guild!;
    const match = emojiInput.match(/:(\d+)>$/) || emojiInput.match(/^(\d+)$/);
    const emojiId = match ? match[1] : null;

    const emoji = emojiId ? guild.emojis.cache.get(emojiId) : guild.emojis.cache.find(e => e.name === emojiInput);

    if (!emoji) {
      return message.reply({ content: 'Emoji não encontrado no servidor!' });
    }

    const emojiName = emoji.name;
    try {
      await emoji.delete();
      await message.reply({ content: `Emoji **:${emojiName}:** removido com sucesso!` });
    } catch (error) {
      console.error('[removeemoji] falha ao remover emoji por prefixo', { guildId: message.guildId, emojiId: emoji.id, emojiName, error });
      await message.reply({ embeds: [ZeroTwoEmbed.error('Emoji não removido', 'O Discord recusou a remoção. Confirme a permissão `ManageEmojisAndStickers`.')] });
    }
  }
};
