import { SlashCommandBuilder, ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import { ZeroTwoEmbed } from '../../utils/embeds.js';
import { Emojis } from '../../utils/emojis.js';

export default {
  data: new SlashCommandBuilder()
    .setName('eval')
    .setDescription('Executa código JavaScript (Restrito ao Owner).')
    .addStringOption(opt => opt.setName('codigo').setDescription('Código JS').setRequired(true)),
  async execute(interaction: ChatInputCommandInteraction) {
    // Verificar se é o seu ID específico
    const OWNER_ID = '554833756431712267';
    if (interaction.user.id !== OWNER_ID) {
      await interaction.editReply({
        content: `${Emojis.warning} Apenas o criador da Zero Two pode usar este comando, Darling!`,
      });
      return;
    }

    const code = interaction.options.getString('codigo', true);
    try {
      let evaled = eval(code);
      if (typeof evaled !== 'string') evaled = require('util').inspect(evaled);

      const embed = new ZeroTwoEmbed()
        .setTitle('💻 Eval Executado')
        .addFields(
          { name: 'Entrada', value: `\`\`\`js\n${code}\`\`\`` },
          { name: 'Saída', value: `\`\`\`js\n${evaled}\`\`\`` }
        );

      await interaction.editReply({ embeds: [embed] });
    } catch (err: any) {
      const embed = new ZeroTwoEmbed()
        .setTitle('❌ Erro no Eval')
        .setDescription(`\`\`\`js\n${err.message}\`\`\``);

      await interaction.editReply({ embeds: [embed] });
    }
  },
};
