import { SlashCommandBuilder, ChatInputCommandInteraction, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuInteraction, ComponentType, EmbedBuilder, Message } from 'discord.js';
import { Emojis } from '../../utils/emojis.js';
import { DashboardService } from '../../services/dashboard/DashboardService.js';

export default {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Exibe o painel de ajuda e comandos da Zero Two.'),

  async execute(interaction: ChatInputCommandInteraction) {
    await this.sendHelpPanel(interaction);
  },

  async executeText(message: Message, args: string[]) {
    await this.sendHelpPanel(message);
  },

  async sendHelpPanel(context: ChatInputCommandInteraction | Message) {
    const isInteraction = context instanceof ChatInputCommandInteraction;
    const user = isInteraction ? context.user : context.author;
    const client = context.client;
    const guildId = context.guildId || context.guild?.id!;

    let prefix = 'zero!';
    try {
      const config = await DashboardService.getGuildConfig(guildId);
      if (config?.prefix) prefix = config.prefix;
    } catch {}

    const embed = new EmbedBuilder()
      .setColor(0xff3b69)
      .setTitle(`🌸 **Painel de Ajuda | Zero Two**`)
      .setDescription(`• Olá **Darling** **@${user.username}**, este é o meu painel oficial de comandos.\n\n` +
        `• Meus prefixos ativos neste servidor são **\`/\`** (Slash) e **\`${prefix}\`** (Tradicional).\n\n` +
        `-> **Selecione uma categoria abaixo** no menu interativo para explorar todas as minhas funcionalidades!`)
      .setThumbnail(client.user?.displayAvatarURL() || null)
      .setFooter({ text: `Zero Two Bot - Darling in the Franxx` });

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('help_category')
        .setPlaceholder('🌸 Selecione uma categoria...')
        .addOptions([
          { label: 'Economia', description: 'D-Coins, Trabalho, Banco e Cassino', value: 'economy', emoji: Emojis.economy || '💰' },
          { label: 'Utilidades', description: 'Prefixos, Lembretes, AFK e Info', value: 'utility', emoji: Emojis.utility || '✨' },
          { label: 'Interação', description: 'Social, Beijos, Abraços e Ship', value: 'social', emoji: Emojis.social || '💖' },
          { label: 'Moderação', description: 'Ban, Kick, Mute, Warn e Canais', value: 'moderation', emoji: Emojis.moderation || '🛡️' },
          { label: 'Administração', description: 'Sorteios, Webhooks, Welcome e AutoRole', value: 'admin', emoji: Emojis.admin || '⚙️' },
        ])
    );

    const response = isInteraction 
      ? await context.reply({ embeds: [embed], components: [row], fetchReply: true })
      : await context.reply({ embeds: [embed], components: [row] });

    const collector = response.createMessageComponentCollector({
      componentType: ComponentType.StringSelect,
      time: 120000
    });

    collector.on('collect', async (i: StringSelectMenuInteraction) => {
      if (i.user.id !== user.id) {
        await i.reply({ content: `${Emojis.warning} **Darling**, apenas quem executou o comando pode usar este menu!`, ephemeral: true });
        return;
      }

      const cat = i.values[0];
      const catEmbed = new EmbedBuilder()
        .setColor(0xff3b69)
        .setThumbnail(client.user?.displayAvatarURL() || null)
        .setFooter({ text: `Zero Two Bot - Darling in the Franxx` });

      if (cat === 'economy') {
        catEmbed.setTitle(`${Emojis.economy} **Comandos de Economia**`)
          .setDescription(
            `• **[] = Obrigatório / () = Opcional**\n\n` +
            `• ${Emojis.seta} **/daily**, **/semanal**, **/mensal**:\n  ◦ Resgate seus **D-Coins** periódicos.\n` +
            `• ${Emojis.seta} **/work**:\n  ◦ Ganhe coins trabalhando (15-20 min).\n` +
            `• ${Emojis.seta} **/banco [depositar/sacar]**:\n  ◦ Gerencie seu cofre protegido.\n` +
            `• ${Emojis.seta} **/pay [usuario] [quant]**:\n  ◦ Transfira coins para outro Darling.\n` +
            `• ${Emojis.seta} **/roubar [usuario]**:\n  ◦ Tente roubar a carteira alheia.\n` +
            `• ${Emojis.seta} **/saldo (usuario)**:\n  ◦ Veja o cartão visual de saldo.\n` +
            `• ${Emojis.seta} **/vip (usuario)**:\n  ◦ Veja seu status e benefícios VIP.\n` +
            `• ${Emojis.seta} **Cassino**: \`/blackjack\`, \`/roleta\`, \`/crash\`, \`/mines\`, \`/slots\`.`
          );
      } else if (cat === 'utility') {
        catEmbed.setTitle(`${Emojis.utility} **Comandos de Utilidades**`)
          .setDescription(
            `• **[] = Obrigatório / () = Opcional**\n\n` +
            `• ${Emojis.seta} **/help**, **/ping**:\n  ◦ Comandos básicos do bot.\n` +
            `• ${Emojis.seta} **/prefixo (novo)**:\n  ◦ Altera o prefixo do servidor.\n` +
            `• ${Emojis.seta} **/lembrete [tempo] [motivo]**:\n  ◦ A Zero Two te avisa no futuro.\n` +
            `• ${Emojis.seta} **/afk (motivo)**:\n  ◦ Define seu status como ausente.\n` +
            `• ${Emojis.seta} **/avatar**, **/banner**, **/serverinfo**:\n  ◦ Informações visuais e do servidor.`
          );
      } else if (cat === 'social') {
        catEmbed.setTitle(`${Emojis.social} **Comandos de Interação**`)
          .setDescription(
            `• **[] = Obrigatório / () = Opcional**\n\n` +
            `• ${Emojis.seta} **/abracar**, **/beijar**, **/cafune**, **/acariciar**:\n  ◦ Demonstre carinho (Gera coins!).\n` +
            `• ${Emojis.seta} **/socar**, **/tapa**, **/provocar**, **/cosquinha**:\n  ◦ Interações divertidas.\n` +
            `• ${Emojis.seta} **/dancar**, **/olhar**, **/flertar**, **/cumprimentar**:\n  ◦ Mais interações sociais.\n` +
            `• ${Emojis.seta} **/ship [user1] (user2)**:\n  ◦ Veja a compatibilidade do casal.\n` +
            `• ${Emojis.seta} **/namorar [usuario]**:\n  ◦ Peça alguém em casamento.\n` +
            `• ${Emojis.seta} **/bio [texto]**:\n  ◦ Defina sua biografia no perfil.\n` +
            `• ${Emojis.seta} **/rep [usuario]**:\n  ◦ Dê reputação a um Darling.`
          );
      } else if (cat === 'moderation') {
        catEmbed.setTitle(`${Emojis.moderation} **Comandos de Moderação**`)
          .setDescription(
            `• **[] = Obrigatório / () = Opcional**\n\n` +
            `• ${Emojis.seta} **/ban**, **/unban**, **/kick**:\n  ◦ Punições para membros.\n` +
            `• ${Emojis.seta} **/mute**, **/unmute**:\n  ◦ Silencia membros temporariamente.\n` +
            `• ${Emojis.seta} **/warn [usuario] [motivo]**:\n  ◦ Aplica um aviso formal (Case).\n` +
            `• ${Emojis.seta} **/clear [quantidade]**:\n  ◦ Limpa o chat rapidamente.\n` +
            `• ${Emojis.seta} **/lock**, **/unlock**:\n  ◦ Controla o envio de mensagens.`
          );
      } else if (cat === 'admin') {
        catEmbed.setTitle(`${Emojis.admin} **Comandos de Administração**`)
          .setDescription(
            `• **[] = Obrigatório / () = Opcional**\n\n` +
            `• ${Emojis.seta} **/addemoji**, **/removeemoji**, **/nuke**:\n  ◦ Gestão de emojis e canais.\n` +
            `• ${Emojis.seta} **/sorteio**, **/webhook**, **/ticket**:\n  ◦ Ferramentas de engajamento e suporte.\n` +
            `• ${Emojis.seta} **/welcome**, **/autorole**:\n  ◦ Configura entrada de membros.\n` +
            `• ${Emojis.seta} **/verificação**:\n  ◦ Cria o painel de verificação.\n` +
            `• ${Emojis.seta} **/setvip [usuario] [nivel]**:\n  ◦ Gerencia níveis VIP (Staff).`
          );
      }

      await i.update({ embeds: [catEmbed], components: [row] });
    });
  },
};
