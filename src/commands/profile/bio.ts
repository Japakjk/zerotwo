import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, Message } from 'discord.js';
import { ProfileService } from '../../services/profile/ProfileService.js';
import { Emojis } from '../../utils/emojis.js';

export default {
  data: new SlashCommandBuilder()
    .setName('bio')
    .setDescription('Defina sua biografia personalizada no perfil da Zero Two')
    .addStringOption(option =>
      option.setName('texto')
        .setDescription('O texto da sua bio (máximo de 150 caracteres)')
        .setMaxLength(150)
        .setRequired(true)),

  async execute(interaction: ChatInputCommandInteraction) {
    const texto = interaction.options.getString('texto', true);
    await this.update(interaction.user.id, interaction.guildId!, texto, (payload: any) => interaction.editReply(payload));
  },

  async executeText(message: Message, args: string[]) {
    const texto = args.join(' ').trim();
    if (!texto) return message.reply({ content: 'Informe o texto da bio. Exemplo: `zero!bio Minha bio`' });
    await this.update(message.author.id, message.guild!.id, texto, (payload: any) => message.reply(payload));
  },

  async update(userId: string, guildId: string, texto: string, send: (payload: any) => Promise<unknown>) {
    if (texto.length > 150) {
      return send({ content: 'Sua bio pode ter no máximo **150 caracteres**.' });
    }

    await ProfileService.updateBio(userId, guildId, texto);

    const embed = new EmbedBuilder()
      .setColor(0xff3b69)
      .setTitle(`${Emojis.check} **Biografia Atualizada**`)
      .setDescription(`Sua bio foi alterada com sucesso, **Darling**!\n\n> *"${texto}"*`)
      .setTimestamp();

    await send({ embeds: [embed] });
  }
};
