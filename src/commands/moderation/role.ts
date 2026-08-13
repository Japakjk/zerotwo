import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import { Emojis } from '../../utils/emojis.js';

export default {
  data: new SlashCommandBuilder()
    .setName('role')
    .setDescription('Gerencie cargos de forma prática no servidor')
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('Usuário alvo')
        .setRequired(true))
    .addRoleOption(option =>
      option.setName('cargo')
        .setDescription('Cargo a ser adicionado/removido')
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

  async execute(interaction: ChatInputCommandInteraction) {
    const user = interaction.options.getUser('usuario', true);
    const role = interaction.options.getRole('cargo', true);
    const member = await interaction.guild?.members.fetch(user.id);

    if (!member) {
      return interaction.reply({ content: `${Emojis.warning} **Darling**, membro não encontrado!`, ephemeral: true });
    }

    if (member.roles.cache.has(role.id)) {
      await member.roles.remove(role.id);
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xff3b69)
            .setDescription(`${Emojis.check} O cargo **${role.name}** foi **removido** de ${user}.`)
        ],
        ephemeral: true
      });
    } else {
      await member.roles.add(role.id);
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xff3b69)
            .setDescription(`${Emojis.check} O cargo **${role.name}** foi **adicionado** a ${user}.`)
        ],
        ephemeral: true
      });
    }
  }
};
