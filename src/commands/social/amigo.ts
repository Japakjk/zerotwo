import { SlashCommandBuilder, ChatInputCommandInteraction, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, Message } from 'discord.js';
import { FriendshipService } from '../../services/social/FriendshipService.js';
import { ZeroTwoEmbed } from '../../utils/embeds.js';
import { Emojis } from '../../utils/emojis.js';

export default {
  data: new SlashCommandBuilder()
    .setName('amigo')
    .setDescription('Gerencie suas amizades no Garden.')
    .addSubcommand(sub => sub.setName('adicionar').setDescription('Envia um pedido de amizade.').addUserOption(opt => opt.setName('usuario').setDescription('Quem você quer adicionar?').setRequired(true)))
    .addSubcommand(sub => sub.setName('remover').setDescription('Remover um amigo.').addUserOption(opt => opt.setName('usuario').setDescription('Quem você quer remover?').setRequired(true)))
    .addSubcommand(sub => sub.setName('lista').setDescription('Mostra sua lista de amigos.')),

  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();
    const userId = interaction.user.id;
    const guildId = interaction.guildId!;
    await this.handleAmigo(interaction, sub, userId, guildId, true);
  },

  async executeText(message: Message, args: string[]) {
    const sub = args[0]?.toLowerCase();
    const userId = message.author.id;
    const guildId = message.guildId!;

    if (!sub || !['adicionar', 'remover', 'lista'].includes(sub)) {
      return message.reply(`${Emojis.warning} Uso correto: \`zero!amigo [adicionar/remover/lista] (@usuario)\``);
    }

    await this.handleAmigo(message, sub, userId, guildId, false, args.slice(1));
  },

  async handleAmigo(context: any, sub: string, userId: string, guildId: string, isInteraction: boolean, args: string[] = []) {
    if (sub === 'adicionar') {
      const target = isInteraction 
        ? context.options.getUser('usuario', true)
        : (context.mentions.users.first() || (args[0] ? await context.client.users.fetch(args[0]).catch(() => null) : null));
      
      if (!target) {
        return isInteraction ? context.editReply('Mencione um usuário!') : context.reply('Mencione um usuário!');
      }

      if (target.id === userId) {
        const msg = `${Emojis.warning} Você não pode adicionar a si mesmo, Darling!`;
        return isInteraction ? context.editReply({ content: msg }) : context.reply({ content: msg });
      }
      if (target.bot) {
        const msg = `${Emojis.warning} Você não pode adicionar bots como amigos!`;
        return isInteraction ? context.editReply({ content: msg }) : context.reply({ content: msg });
      }

      const result = await FriendshipService.sendRequest(userId, target.id, guildId);
      if (!result.success) {
        const msg = `${Emojis.warning} ${result.message}`;
        return isInteraction ? context.editReply({ content: msg }) : context.reply({ content: msg });
      }

      const embed = new ZeroTwoEmbed()
        .setTitle(`${Emojis.achievement} Pedido de Amizade`)
        .setDescription(
          `O Darling **${isInteraction ? context.user.username : context.author.username}** quer ser seu amigo, <@${target.id}>!\n\n` +
          `${Emojis.seta} Clique em um dos botões abaixo para aceitar ou recusar.`
        )
        .setThumbnail(isInteraction ? context.user.displayAvatarURL() : context.author.displayAvatarURL());

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(`friend:${guildId}:${userId}:${target.id}:accept`)
          .setLabel('Aceitar')
          .setStyle(ButtonStyle.Success)
          .setEmoji(Emojis.check || '✅'),
        new ButtonBuilder()
          .setCustomId(`friend:${guildId}:${userId}:${target.id}:decline`)
          .setLabel('Recusar')
          .setStyle(ButtonStyle.Danger)
          .setEmoji(Emojis.ban || '❌')
      );

      const response = isInteraction 
        ? await context.editReply({ content: `<@${target.id}>`, embeds: [embed], components: [row] })
        : await context.reply({ content: `<@${target.id}>`, embeds: [embed], components: [row] });

      const collector = response.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 60000,
        filter: (i: any) => i.isButton(),
      });

      collector.on('collect', async (i: any) => {
        if (i.user.id !== target.id) {
          await i.reply({ content: `${Emojis.warning} Apenas o Darling **${target.username}** pode responder a este pedido!`, ephemeral: true });
          return;
        }

        if (i.customId === `friend:${guildId}:${userId}:${target.id}:accept`) {
          const success = await FriendshipService.acceptRequest(target.id, userId, guildId);
          if (success) {
            const acceptedEmbed = new ZeroTwoEmbed()
              .setTitle(`${Emojis.check} Amizade Firmada`)
              .setDescription(`Agora **${isInteraction ? context.user.username : context.author.username}** e **${target.username}** são amigos oficiais no Garden! 🦖🌸`);
            await i.update({ embeds: [acceptedEmbed], components: [] });
          } else {
            await i.update({ content: 'Pedido não encontrado ou já processado.', embeds: [], components: [] });
          }
        } else if (i.customId === `friend:${guildId}:${userId}:${target.id}:decline`) {
          const declinedEmbed = new ZeroTwoEmbed()
            .setTitle(`${Emojis.warning} Pedido Recusado`)
            .setDescription(`O pedido de amizade foi recusado.`);
          await i.update({ embeds: [declinedEmbed], components: [] });
        }
          collector.stop('completed');
      });

      collector.on('end', async (_: any, reason: string) => {
        if (reason === 'time') {
          const timeoutEmbed = new ZeroTwoEmbed()
            .setTitle(`${Emojis.clock} Pedido Expirado`)
            .setDescription(`O pedido de amizade expirou sem alteração. Se ainda quiser, envie um novo pedido para **${target.username}**.`);
          if (isInteraction) await context.editReply({ embeds: [timeoutEmbed], components: [] }).catch(() => {});
          else await response.edit({ embeds: [timeoutEmbed], components: [] }).catch(() => {});
        }
      });
      return;
    }

    if (sub === 'remover') {
      const target = isInteraction 
        ? context.options.getUser('usuario', true)
        : (context.mentions.users.first() || (args[0] ? await context.client.users.fetch(args[0]).catch(() => null) : null));
      
      if (!target) {
        const msg = 'Mencione um usuário!';
        return isInteraction ? context.editReply(msg) : context.reply(msg);
      }

      const success = await FriendshipService.removeFriend(userId, target.id, guildId);
      const msg = success ? `${Emojis.check} Amigo removido com sucesso.` : `${Emojis.warning} Vocês não são amigos no Garden.`;
      return isInteraction ? context.editReply({ content: msg }) : context.reply({ content: msg });
    }

    if (sub === 'lista') {
      const friends = await FriendshipService.getFriends(userId, guildId);
      if (friends.length === 0) {
        const msg = `${Emojis.warning} Você ainda não tem amigos no Garden, Darling. Que tal adicionar alguns?`;
        return isInteraction ? context.editReply({ content: msg }) : context.reply({ content: msg });
      }

      const list = friends.map(f => {
        const friendId = f.user1Id === userId ? f.user2Id : f.user1Id;
        return `• <@${friendId}>`;
      }).join('\n');

      const embed = new ZeroTwoEmbed()
        .setTitle(`${Emojis.achievement} Seus Amigos no Garden`)
        .setDescription(list);

      return isInteraction ? context.editReply({ embeds: [embed] }) : context.reply({ embeds: [embed] });
    }
  }
};
