import { SlashCommandBuilder, ChatInputCommandInteraction, Message } from 'discord.js';
import { UserModel } from '../../database/models/User.js';
import { ZeroTwoEmbed } from '../../utils/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('afk')
    .setDescription('Define seu estado como AFK no Garden.')
    .addStringOption(opt => opt.setName('motivo').setDescription('Por que você vai sair?').setRequired(false)),
  async execute(interaction: ChatInputCommandInteraction) {
    const reason = interaction.options.getString('motivo') || 'Sem motivo especificado';
    await UserModel.findOneAndUpdate(
      { userId: interaction.user.id, guildId: interaction.guildId! },
      { afk: { reason, since: new Date() } },
      { upsert: true }
    );
    const embed = new ZeroTwoEmbed().setTitle('💤 Modo AFK Ativado').setDescription(`**${interaction.user.username}** agora está AFK.\n**Motivo:** ${reason}\nA Zero Two estará te esperando, Darling! 🦖🌸`);
    await interaction.editReply({ embeds: [embed] });
  },

  async executeText(message: Message, args: string[]) {
    const reason = args.join(' ').trim() || 'Sem motivo especificado';
    await UserModel.findOneAndUpdate(
      { userId: message.author.id, guildId: message.guild!.id },
      { afk: { reason, since: new Date() } },
      { upsert: true }
    );
    const embed = new ZeroTwoEmbed().setTitle('💤 Modo AFK Ativado').setDescription(`**${message.author.username}** agora está AFK.\n**Motivo:** ${reason}\nA Zero Two estará te esperando, Darling! 🦖🌸`);
    await message.reply({ embeds: [embed] });
  },
};
