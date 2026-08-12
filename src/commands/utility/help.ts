import { SlashCommandBuilder, ChatInputCommandInteraction, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuInteraction, ComponentType } from 'discord.js';
import { ZeroTwoEmbed } from '../../utils/embeds.js';
import { Emojis } from '../../utils/emojis.js';

export default {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Exibe o painel de ajuda e comandos da Zero Two.'),
  async execute(interaction: ChatInputCommandInteraction) {
    const embed = new ZeroTwoEmbed()
      .setTitle(`🌸 Ajuda | Zero Two`)
      .setDescription(`• Bem-vindo(a) **@${interaction.user.username}**, esse é o painel de comandos/ajuda da Zero Two.\n\n` +
        `-> Selecione uma categoria abaixo para ver os comandos disponíveis até o momento.`)
      .setThumbnail(interaction.client.user.displayAvatarURL())
      .setFooter({ text: `Comando executado por: ${interaction.user.username}` });

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('help_category')
        .setPlaceholder('Selecione uma categoria')
        .addOptions([
          { label: 'Economia', description: 'Comandos de economia, banco e apostas', value: 'economy', emoji: Emojis.cat_economia },
          { label: 'Utilidades', description: 'Comandos úteis, avatar e banner', value: 'utility', emoji: Emojis.cat_utilidades },
          { label: 'Interação', description: 'Comandos de abraçar, beijar e social', value: 'social', emoji: Emojis.cat_interacao },
          { label: 'Moderação', description: 'Comandos de ban, kick, mute, clear e lock', value: 'moderation', emoji: Emojis.cat_moderacao },
          { label: 'Administração', description: 'Comandos de sorteios, emojis e webhooks', value: 'admin', emoji: Emojis.cat_administracao },
        ])
    );

    const response = await interaction.editReply({ embeds: [embed], components: [row] });

    const collector = response.createMessageComponentCollector({
      componentType: ComponentType.StringSelect,
      time: 120000
    });

    collector.on('collect', async (i: StringSelectMenuInteraction) => {
      if (i.user.id !== interaction.user.id) {
        await i.reply({ content: 'Apenas o autor do comando pode usar este menu, Darling!', ephemeral: true });
        return;
      }

      const cat = i.values[0];
      const catEmbed = new ZeroTwoEmbed().setThumbnail(interaction.client.user.displayAvatarURL());

      if (cat === 'economy') {
        catEmbed.setTitle(`${Emojis.cat_economia} Comandos de Economia | Zero Two`)
          .setDescription(
            `• [] = Obrigatório / () = Opcional\n\n` +
            `• ${Emojis.seta} **/daily**:\n  ◦ Resgate seus coins diários.\n` +
            `• ${Emojis.seta} **/semanal**:\n  ◦ Resgate seus coins semanais.\n` +
            `• ${Emojis.seta} **/mensal**:\n  ◦ Resgate seus coins mensais.\n` +
            `• ${Emojis.seta} **/banco depositar [quantidade]**:\n  ◦ Deposite seus coins.\n` +
            `• ${Emojis.seta} **/work**:\n  ◦ Trabalhe para receber coins.\n` +
            `• ${Emojis.seta} **/saldo (usuario)**:\n  ◦ Veja seu saldo em banco/carteira com cartão visual.\n` +
            `• ${Emojis.seta} **/mensagens (usuario)**:\n  ◦ Veja sua contagem de mensagens e recompensas.`
          );
      } else if (cat === 'utility') {
        catEmbed.setTitle(`${Emojis.cat_utilidades} Comandos de Utilidades | Zero Two`)
          .setDescription(
            `• ${Emojis.seta} **/help**:\n  ◦ Exibe o painel de ajuda.\n` +
            `• ${Emojis.seta} **/ping**:\n  ◦ Verifica a latência da Zero Two.\n` +
            `• ${Emojis.seta} **/avatar (usuario)**:\n  ◦ Exibe o avatar de um Darling.\n` +
            `• ${Emojis.seta} **/banner (usuario)**:\n  ◦ Exibe o banner de um Darling.\n` +
            `• ${Emojis.seta} **/serverinfo**:\n  ◦ Informações do Garden (servidor).\n` +
            `• ${Emojis.seta} **/afk (motivo)**:\n  ◦ Deixa você ausente com aviso automático.`
          );
      } else if (cat === 'social') {
        catEmbed.setTitle(`${Emojis.cat_interacao} Comandos de Interação | Zero Two`)
          .setDescription(
            `• ${Emojis.seta} **/abracar [usuario]**:\n  ◦ Abrace um Darling.\n` +
            `• ${Emojis.seta} **/beijar [usuario]**:\n  ◦ Beije um Darling.\n` +
            `• ${Emojis.seta} **/cafune [usuario]**:\n  ◦ Dê carinho em um Darling.\n` +
            `• ${Emojis.seta} **/socar [usuario]**:\n  ◦ Socar um Darling.\n` +
            `• ${Emojis.seta} **/tapa [usuario]**:\n  ◦ Dar um tapa em um Darling.\n` +
            `• ${Emojis.seta} **/namorar [usuario]**:\n  ◦ Envie um pedido de namoro/casamento.`
          );
      } else if (cat === 'moderation') {
        catEmbed.setTitle(`${Emojis.cat_moderacao} Comandos de Moderação | Zero Two`)
          .setDescription(
            `• ${Emojis.seta} **/ban [usuario] (motivo)**:\n  ◦ Bane um usuário do Garden.\n` +
            `• ${Emojis.seta} **/kick [usuario] (motivo)**:\n  ◦ Expulsa um usuário.\n` +
            `• ${Emojis.seta} **/timeout [usuario] [tempo] (motivo)**:\n  ◦ Silencia temporariamente.\n` +
            `• ${Emojis.seta} **/warn [usuario] [motivo]**:\n  ◦ Aplica um aviso formal.\n` +
            `• ${Emojis.seta} **/clear [quantidade]**:\n  ◦ Limpa mensagens do chat.\n` +
            `• ${Emojis.seta} **/lock** / **/unlock**:\n  ◦ Tranca ou destranca o canal.`
          );
      } else if (cat === 'admin') {
        catEmbed.setTitle(`${Emojis.cat_administracao} Comandos de Administração | Zero Two`)
          .setDescription(
            `• ${Emojis.seta} **/addemoji [emojis]**:\n  ◦ Adicione emoji(s) ao servidor.\n` +
            `• ${Emojis.seta} **/removeemoji [emojis]**:\n  ◦ Remova emoji(s) do servidor.\n` +
            `• ${Emojis.seta} **/nuke**:\n  ◦ Reseta completamente o canal atual.\n` +
            `• ${Emojis.seta} **/sorteio**:\n  ◦ Crie um sorteio no servidor.\n` +
            `• ${Emojis.seta} **/webhook**:\n  ◦ Gerencie webhooks no servidor.\n` +
            `• ${Emojis.seta} **/setvip [usuario] [nivel]**:\n  ◦ Define o nível VIP (1 a 5).`
          );
      }

      await i.update({ embeds: [catEmbed], components: [row] });
    });

    collector.on('end', () => {
      interaction.editReply({ components: [] }).catch(() => {});
    });
  },
};
