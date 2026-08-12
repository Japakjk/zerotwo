import { ZeroTwoEmbed } from '../../utils/embeds.js';

export interface InteractionData {
  action: string;
  sender: string;
  target: string;
}

export class SocialService {
  private static phrases: Record<string, string[]> = {
    beijar: [
      '**{sender}** deu um beijo carinhoso em **{target}**! "Você é meu Darling agora, não é?" 💋',
      'Um beijo doce de **{sender}** para **{target}**. A Zero Two aprova esse casal! 🌸',
      '**{sender}** beijou **{target}**! "Sabor de mel... delicioso." 🍯',
    ],
    abracar: [
      '**{sender}** deu um abraço apertado em **{target}**! "Não vou te soltar, Darling." 🤗',
      'Um abraço quentinho de **{sender}** para **{target}**. O Garden está mais feliz hoje! ❤️',
      '**{sender}** envolveu **{target}** em seus braços. Proteção total! 🦖',
    ],
    cafune: [
      '**{sender}** está fazendo um cafuné relaxante em **{target}**. "Bom menino(a)..." ✨',
      '**{sender}** acariciou os cabelos de **{target}**. Tão fofo! 🌸',
    ],
    socar: [
      '**{sender}** deu um soco em **{target}**! "Ei! Cuidado com o que você diz!" 💢',
      'POW! **{sender}** acertou **{target}**. Isso deve ter doído... 👊',
    ],
    acariciar: [
      '**{sender}** acariciou o rosto de **{target}**. "Você tem um cheiro bom..." 🌸',
      'Um toque gentil de **{sender}** em **{target}**. ❤️',
    ],
    cosquinha: [
      '**{sender}** está fazendo cosquinhas em **{target}**! "Pare de rir, Darling!" 😂',
      'Cosquinhas sem parar! **{sender}** não tem piedade de **{target}**. ✌️',
    ],
    dancar: [
      '**{sender}** está dançando alegremente com **{target}**! 💃🕺',
      'Que ritmo! **{sender}** e **{target}** estão dominando a pista do Garden! ✨',
    ],
    cumprimentar: [
      '**{sender}** cumprimentou **{target}** com um sorriso. "Olá, Darling!" 👋',
      'Um cumprimento formal (ou nem tanto) de **{sender}** para **{target}**. 🌸',
    ],
    olhar: [
      '**{sender}** está encarando **{target}** intensamente... "O que você está escondendo?" 🦖',
      '**{sender}** não consegue tirar os olhos de **{target}**. 👀',
    ],
    flertar: [
      '**{sender}** lançou um olhar sedutor para **{target}**. "Você quer pilotar comigo hoje?" 😏',
      '**{sender}** está flertando com **{target}**. O clima esquentou no Garden! 🔥',
    ],
    provocar: [
      '**{sender}** está provocando **{target}**! "Você é tão fraco, Darling..." 👅',
      'Uma provocação de **{sender}** para **{target}**. Quem vai ceder primeiro? 🦖',
    ]
  };

  static getInteractionEmbed(action: string, senderName: string, targetName: string): ZeroTwoEmbed {
    const actionPhrases = this.phrases[action] || ['**{sender}** interagiu com **{target}**!'];
    const randomPhrase = actionPhrases[Math.floor(Math.random() * actionPhrases.length)];
    
    const description = randomPhrase
      .replace('{sender}', senderName)
      .replace('{target}', targetName);

    return new ZeroTwoEmbed()
      .setDescription(description);
  }
}
