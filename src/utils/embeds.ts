import { EmbedBuilder } from 'discord.js';
import { Emojis } from './emojis.js';

export class ZeroTwoEmbed extends EmbedBuilder {
  constructor() {
    super();
    this.setColor('#ff3b69'); // Cor rosa clássica da Zero Two
    this.setTimestamp();
    // Footer sem ícone externo quebrado ou usando link dinâmico
    this.setFooter({
      text: 'Darling Bot • "Você quer ser meu Darling?"',
    });
  }

  static success(title: string, description: string): ZeroTwoEmbed {
    return new ZeroTwoEmbed()
      .setTitle(`${Emojis.check || '🌸'} ${title}`)
      .setDescription(description)
      .setColor('#ff3b69');
  }

  static error(title: string, description: string, prefix: string = 'zero!'): ZeroTwoEmbed {
    const desc = description.includes('{prefix}') 
      ? description.replace(/{prefix}/g, prefix) 
      : description;
      
    return new ZeroTwoEmbed()
      .setTitle(`${Emojis.ban} ${title}`)
      .setDescription(desc)
      .setColor('#ff3b69'); // Mantendo o rosa mesmo no erro para seguir a temática
  }

  static warning(title: string, description: string): ZeroTwoEmbed {
    return new ZeroTwoEmbed()
      .setTitle(`${Emojis.warning} ${title}`)
      .setDescription(description)
      .setColor('#ff3b69');
  }
}
