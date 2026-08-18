import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, EmbedBuilder, Message } from 'discord.js';
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
      return interaction.editReply({ content: `${Emojis.warning} **Darling**, membro não encontrado!` });
    }

    if (member.roles.cache.has(role.id)) {
      await member.roles.remove(role.id);
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xff3b69)
            .setDescription(`${Emojis.check} O cargo **${role.name}** foi **removido** de ${user}.`)
        ]
      });
    } else {
      await member.roles.add(role.id);
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xff3b69)
            .setDescription(`${Emojis.check} O cargo **${role.name}** foi **adicionado** a ${user}.`)
        ]
      });
    }
  },

  async executeText(message: Message, args: string[]) {
    if (!message.member?.permissions.has(PermissionFlagsBits.ManageRoles)) {
      return message.reply({ content: `${Emojis.warning} Você precisa ter permissão de **Gerenciar Cargos**, Darling!` });
    }

    const targetUser = message.mentions.users.first() || (args[0] ? await message.client.users.fetch(args[0]).catch(() => null) : null);
    const roleMention = message.mentions.roles.first() || (args[1] ? message.guild?.roles.cache.get(args[1].replace(/<@&|>/g, '')) : null);

    if (!targetUser || !roleMention) {
      return message.reply({ content: `Uso correto: \`zero!role @usuario @cargo\`, Darling!` });
    }

    const member = await message.guild?.members.fetch(targetUser.id).catch(() => null);
    if (!member) {
      return message.reply({ content: `${Emojis.warning} Membro não encontrado no Garden!` });
    }

    if (member.roles.cache.has(roleMention.id)) {
      await member.roles.remove(roleMention.id);
      await message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xff3b69)
            .setDescription(`${Emojis.check} O cargo **${roleMention.name}** foi **removido** de ${targetUser}.`)
        ]
      });
    } else {
      await member.roles.add(roleMention.id);
      await message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xff3b69)
            .setDescription(`${Emojis.check} O cargo **${roleMention.name}** foi **adicionado** a ${targetUser}.`)
        ]
      });
    }
  }
};
