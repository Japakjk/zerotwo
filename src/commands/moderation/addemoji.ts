import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, Attachment, Message } from 'discord.js';
import { ZeroTwoEmbed } from '../../utils/embeds.js';
import { Emojis } from '../../utils/emojis.js';

export default {
  data: new SlashCommandBuilder()
    .setName('addemoji')
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
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageEmojisAndStickers),

  async execute(interaction: ChatInputCommandInteraction) {
    const attachment = interaction.options.getAttachment('imagem', true) as Attachment;
    const name = interaction.options.getString('nome', true);

    try {
      const emoji = await interaction.guild!.emojis.create({
        attachment: attachment.url,
        name: name
      });

      const embed = new ZeroTwoEmbed()
        .setTitle(`${Emojis.check} Emoji Adicionado`)
        .setDescription(`${Emojis.seta} O emoji ${emoji} (**:${emoji.name}:**) foi adicionado com sucesso ao Garden, **Darling**!`);

      await interaction.editReply({ embeds: [embed] });
    } catch (error: any) {
      await interaction.editReply({
        embeds: [ZeroTwoEmbed.error('Erro ao Adicionar Emoji', `Não consegui adicionar o emoji, **Darling**. Certifique-se de que o arquivo é válido e o servidor tem vagas.\nErro: \`${error.message}\``)]
      });
    }
  },

  async executeText(message: Message, args: string[]) {
    if (!message.member?.permissions.has(PermissionFlagsBits.ManageEmojisAndStickers)) return;

    const attachment = message.attachments.first();
    const name = args[0];

    if (!attachment || !name) {
      return message.reply({ content: 'Você precisa anexar uma imagem e fornecer um nome para o emoji, Darling!' });
    }

    try {
      const emoji = await message.guild!.emojis.create({
        attachment: attachment.url,
        name: name
      });

      const embed = new ZeroTwoEmbed()
        .setTitle(`${Emojis.check} Emoji Adicionado`)
        .setDescription(`${Emojis.seta} O emoji ${emoji} (**:${emoji.name}:**) foi adicionado com sucesso ao Garden, **Darling**!`);

      await message.reply({ embeds: [embed] });
    } catch (error: any) {
      await message.reply({
        embeds: [ZeroTwoEmbed.error('Erro ao Adicionar Emoji', `Não consegui adicionar o emoji, **Darling**.\nErro: \`${error.message}\``)]
      });
    }
  }
};
