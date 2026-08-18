import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, Attachment } from 'discord.js';
import { ZeroTwoEmbed } from '../../utils/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('emoji')
    .setDescription('Gerenciamento de emojis do Garden.')
    .addSubcommand(sub =>
      sub.setName('add')
        .setDescription('Adiciona um emoji ao servidor através de uma imagem/gif.')
        .addAttachmentOption(opt =>
          opt.setName('imagem')
            .setDescription('Arquivo de imagem (PNG, JPEG ou GIF)')
            .setRequired(true)
        )
        .addStringOption(opt =>
          opt.setName('nome')
            .setDescription('Nome do emoji')
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName('remove')
        .setDescription('Remove um emoji do servidor.')
        .addStringOption(opt =>
          opt.setName('emoji')
            .setDescription('O emoji ou ID do emoji a ser removido')
            .setRequired(true)
        )
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageEmojisAndStickers),
  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();
    const guild = interaction.guild!;

    if (sub === 'add') {
      const attachment = interaction.options.getAttachment('imagem', true) as Attachment;
      const name = interaction.options.getString('nome', true);

      try {
        const emoji = await guild.emojis.create({
          attachment: attachment.url,
          name: name
        });

        const embed = new ZeroTwoEmbed()
          .setTitle('🌸 Emoji Adicionado')
          .setDescription(`• O emoji ${emoji} (**:${emoji.name}:**) foi adicionado com sucesso ao Garden, Darling!`);

        await interaction.editReply({ embeds: [embed] });
      } catch (error: any) {
        await interaction.editReply({
          embeds: [ZeroTwoEmbed.error('Erro ao Adicionar Emoji', `Não consegui adicionar o emoji, Darling. Certifique-se de que o arquivo é válido e o servidor tem vagas.\nErro: \`${error.message}\``)]
        });
      }
    } else if (sub === 'remove') {
      const emojiInput = interaction.options.getString('emoji', true);
      // Extrai ID do emoji se for formato customizado <:name:id> ou açaõ direta
      const match = emojiInput.match(/:(\d+)>$/) || emojiInput.match(/^(\d+)$/);
      const emojiId = match ? match[1] : null;

      const emoji = emojiId ? guild.emojis.cache.get(emojiId) : guild.emojis.cache.find(e => e.name === emojiInput);

      if (!emoji) {
        return interaction.editReply({
          embeds: [ZeroTwoEmbed.error('Emoji não encontrado', 'Não encontrei este emoji no servidor, Darling!')]
        });
      }

      const emojiName = emoji.name;
      await emoji.delete();

      const embed = new ZeroTwoEmbed()
        .setTitle('🌸 Emoji Removido')
        .setDescription(`• O emoji **:${emojiName}:** foi removido com sucesso do Garden.`);

      await interaction.editReply({ embeds: [embed] });
    }
  },
};
