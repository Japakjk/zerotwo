import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { UserModel } from '../../database/models/User.js';
import { ZeroTwoEmbed } from '../../utils/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('personalizar')
    .setDescription('Personalize seu perfil no Garden.')
    .addSubcommand(sub => sub.setName('bio').setDescription('Altera sua bio.').addStringOption(opt => opt.setName('texto').setDescription('Sua nova bio').setRequired(true).setMaxLength(200)))
    .addSubcommand(sub => sub.setName('cor').setDescription('Altera a cor do seu perfil.').addStringOption(opt => opt.setName('hex').setDescription('Código HEX da cor (ex: #ff3b69)').setRequired(true)))
    .addSubcommand(sub => sub.setName('banner').setDescription('Altera o banner do seu perfil.').addStringOption(opt => opt.setName('url').setDescription('URL da imagem do banner').setRequired(true)))
    .addSubcommand(sub => sub.setName('titulo').setDescription('Altera seu título.').addStringOption(opt => opt.setName('texto').setDescription('Seu novo título').setRequired(true).setMaxLength(30))),
  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();
    const userId = interaction.user.id;
    const guildId = interaction.guildId!;

    let update = {};
    if (sub === 'bio') update = { bio: interaction.options.getString('texto') };
    if (sub === 'cor') {
      const hex = interaction.options.getString('hex')!;
      if (!/^#[0-9A-F]{6}$/i.test(hex)) return interaction.editReply({ content: 'Código HEX inválido! Use o formato #RRGGBB.' });
      update = { color: hex };
    }
    if (sub === 'banner') update = { banner: interaction.options.getString('url') };
    if (sub === 'titulo') update = { title: interaction.options.getString('texto') };

    await UserModel.findOneAndUpdate({ userId, guildId }, update, { upsert: true });

    await interaction.editReply({
      embeds: [ZeroTwoEmbed.success('Perfil Atualizado', 'Suas alterações foram salvas, Darling! Ficou lindo. 🦖🌸')]
    });
  },
};
