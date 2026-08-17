import { SlashCommandBuilder, ChatInputCommandInteraction, Message, EmbedBuilder } from 'discord.js';
import { Emojis } from '../../utils/emojis.js';
import { config } from '../../config/config.js';

const OWNER_IDS = [config.OWNER_ID];

export default {
  data: new SlashCommandBuilder()
    .setName('eval')
    .setDescription('Executa código JavaScript (Apenas para o Owner do Bot).')
    .addStringOption(option =>
      option.setName('codigo').setDescription('Código a ser executado').setRequired(true)
    ),
  deferEphemeral: true,
  async execute(interaction: ChatInputCommandInteraction) {
    if (!OWNER_IDS.includes(interaction.user.id)) {
      return interaction.editReply({ content: `${Emojis.ban} Apenas o **Owner do Bot** pode usar este comando, Darling!` });
    }
    const code = interaction.options.getString('codigo', true);
    await this.runEval(interaction, code);
  },
  async executeText(message: Message, args: string[]) {
    if (!OWNER_IDS.includes(message.author.id)) return message.reply(`${Emojis.ban} Apenas o **Owner do Bot** pode usar este comando!`);
    const code = args.join(' ');
    if (!code) return message.reply('Forneça um código para executar, Darling.');
    await this.runEval(message, code);
  },
  async runEval(context: ChatInputCommandInteraction | Message, code: string) {
    const isInteraction = context instanceof ChatInputCommandInteraction;
    try {
      let evaled = eval(code);
      if (typeof evaled !== 'string') evaled = (await import('util')).inspect(evaled);
      
      const embed = new EmbedBuilder()
        .setColor(0xff3b69)
        .setTitle('💻 **Eval Executado**')
        .addFields(
          { name: '📥 Entrada', value: `\`\`\`js\n${code.substring(0, 1024)}\n\`\`\`` },
          { name: '📤 Saída', value: `\`\`\`js\n${evaled.substring(0, 1024)}\n\`\`\`` }
        );

      if (isInteraction) await (context as ChatInputCommandInteraction).editReply({ embeds: [embed] });
      else await context.reply({ embeds: [embed] });
    } catch (err: any) {
      if (isInteraction) await (context as ChatInputCommandInteraction).editReply({ content: '❌ **O eval falhou ao executar o código fornecido.**' });
      else await context.reply({ content: `❌ **Erro:**\n\`\`\`js\n${err.message}\n\`\`\`` });
    }
  }
};
