import { SlashCommandBuilder, ChatInputCommandInteraction, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, Message } from 'discord.js';
import { RelationshipService } from '../../services/social/RelationshipService.js';
import { ZeroTwoEmbed } from '../../utils/embeds.js';
import { Emojis } from '../../utils/emojis.js';
import { SocialGifs } from '../../utils/socialGifs.js';

export default {
  data: new SlashCommandBuilder()
    .setName('namorar')
    .setDescription('Peça um Darling em namoro com um pedido especial.')
    .addUserOption(opt => opt.setName('usuario').setDescription('Quem você quer pedir em namoro?').setRequired(true)),

  async execute(interaction: ChatInputCommandInteraction) {
    const target = interaction.options.getUser('usuario', true);
    await this.handleProposal(interaction, target, interaction.user, interaction.guildId!);
  },

  async executeText(message: Message, args: string[]) {
    const target = message.mentions.users.first() || (args[0] ? await message.client.users.fetch(args[0]).catch(() => null) : null);
    if (!target) {
      return message.reply({ content: `Mencione um Darling para pedir em namoro, Darling! Ex: \`zero!namorar @usuario\`` });
    }
    await this.handleProposal(message, target, message.author, message.guildId!);
  },

  async handleProposal(context: ChatInputCommandInteraction | Message, target: any, author: any, guildId: string) {
    const isInteraction = context instanceof ChatInputCommandInteraction;

    if (target.id === author.id) {
      const msg = `${Emojis.warning} Você não pode namorar consigo mesmo, Darling!`;
      return isInteraction ? context.editReply({ content: msg }) : context.reply({ content: msg });
    }

    if (target.bot) {
      const msg = `${Emojis.warning} Você não pode namorar bots, Darling! A Zero Two já tem o Hiro! 🦖❤️`;
      return isInteraction ? context.editReply({ content: msg }) : context.reply({ content: msg });
    }

    const result = await RelationshipService.propose(author.id, target.id, guildId);

    if (!result.success) {
      const msg = `${Emojis.warning} ${result.message}`;
      return isInteraction ? context.editReply({ content: msg }) : context.reply({ content: msg });
    }

    const embed = new ZeroTwoEmbed()
      .setTitle(`${Emojis.mensagemCoracao} Um Novo Pedido de União no Garden!`)
      .setDescription(
        `O Darling **${author.username}** fez uma proposta irresistível para **${target.username}**!\n\n` +
        `> *"Você aceita ser meu parceiro(a) e pilotar comigo no Strelizia?"*\n\n` +
        `${Emojis.seta} Clique em um dos botões abaixo para responder, Darling!`
      )
      .setThumbnail(author.displayAvatarURL());

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`proposal:${guildId}:${author.id}:${target.id}:accept`)
        .setLabel('Aceitar')
        .setStyle(ButtonStyle.Success)
        .setEmoji(Emojis.confirmacao),
      new ButtonBuilder()
        .setCustomId(`proposal:${guildId}:${author.id}:${target.id}:decline`)
        .setLabel('Recusar')
        .setStyle(ButtonStyle.Danger)
        .setEmoji(Emojis.x)
    );

    const response = isInteraction 
      ? await context.editReply({ content: `<@${target.id}>`, embeds: [embed], components: [row] })
      : await context.reply({ content: `<@${target.id}>`, embeds: [embed], components: [row] });

    const collector = response.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 60000,
      filter: i => i.isButton(),
    });

    collector.on('collect', async i => {
      if (i.user.id !== target.id) {
        await i.reply({ content: `${Emojis.warning} Apenas o Darling **${target.username}** pode responder a este pedido!`, ephemeral: true });
        return;
      }

      if (i.customId === `proposal:${guildId}:${author.id}:${target.id}:accept`) {
        const acceptResult = await RelationshipService.accept(target.id, guildId);
        if (acceptResult.success) {
          const successEmbed = new ZeroTwoEmbed()
            .setTitle(`${Emojis.confirmacao} União Oficializada!`)
            .setDescription(
              `Parabéns, **${author.username}** e **${target.username}**!\n\n` +
              `${Emojis.coracao} Agora vocês são oficialmente um casal no Garden! Que a Strelizia brilhe para vocês!\n\n` +
              `[\`Visualizar o momento\`](<${SocialGifs.casar}>)`
            )
            .setThumbnail(author.displayAvatarURL())
            .setImage(SocialGifs.casar);

          await i.update({ embeds: [successEmbed], components: [] });
        } else {
          console.error('[namorar] falha ao aceitar proposta', { guildId, authorId: author.id, targetId: target.id, success: acceptResult.success });
          await i.update({ embeds: [ZeroTwoEmbed.error('Pedido não concluído', 'A proposta expirou ou já não está disponível. Nenhuma alteração foi feita.')], components: [] });
        }
      } else if (i.customId === `proposal:${guildId}:${author.id}:${target.id}:decline`) {
        await RelationshipService.decline(target.id, guildId);
        const declineEmbed = new ZeroTwoEmbed()
          .setTitle(`${Emojis.x} Pedido Recusado`)
          .setDescription(`${Emojis.coracaoPartido} O Darling **${target.username}** recusou o pedido de **${author.username}**. Não fique triste, há muitos outros parceiros no Garden!`);

        await i.update({ embeds: [declineEmbed], components: [] });
      }
        collector.stop('completed');
    });

    collector.on('end', async (_, reason) => {
      if (reason === 'time') {
        await RelationshipService.decline(target.id, guildId).catch(() => {});
        const timeoutEmbed = new ZeroTwoEmbed()
          .setTitle(`${Emojis.despertador} Pedido Expirado`)
          .setDescription(`O tempo para **${target.username}** responder ao pedido de **${author.username}** expirou. Nenhuma alteração foi feita; envie um novo pedido se ainda fizer sentido.`);
        
        if (isInteraction) {
          await context.editReply({ embeds: [timeoutEmbed], components: [] }).catch(() => {});
        } else {
          await response.edit({ embeds: [timeoutEmbed], components: [] }).catch(() => {});
        }
      }
    });
  }
};
