import { ZeroTwoEmbed } from '../../utils/embeds.js';
import { Emojis } from '../../utils/emojis.js';
import { EconomyService } from '../economy/EconomyService.js';
import { RelationshipModel } from '../../database/models/Relationship.js';

export interface InteractionData {
  action: string;
  sender: string;
  target: string;
}

export class SocialService {
  private static interactionConfig: Record<string, { phrases: string[]; gifs: string[] }> = {
    beijar: {
      phrases: [
        '**{sender}** deu um beijo apaixonado em **{target}**! *"Você é meu único Darling, sabia?"* 💋',
        'Um beijo doce e inesquecível de **{sender}** para **{target}**. A **Zero Two** aprova esse romance! 🌸',
        '**{sender}** beijou **{target}** intensamente! *"Tem gosto de mel... delicioso."* 🍯'
      ],
      gifs: [
        'https://media.giphy.com/media/ique71N0Wc0E0/giphy.gif',
        'https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExOWd3cWhxM2R3amc2Z3R4aWc3NWQ1dXoxN2FnbG8ydjFqbWpueWVodyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3ohhwkKBqcIVWpvUHm/giphy.gif'
      ]
    },
    abracar: {
      phrases: [
        '**{sender}** envolveu **{target}** em um abraço caloroso e apertado! *"Não vou te soltar nunca, Darling."* 🤗',
        'Um abraço repleto de carinho de **{sender}** em **{target}**. O **Garden** inteiro está torcendo por vocês! ❤️',
        '**{sender}** puxou **{target}** para um abraço protetor. *"Você é meu parceiro perfeito."* 🦖'
      ],
      gifs: [
        'https://media.giphy.com/media/26AHCz1q12Xn7sWSA/giphy.gif',
        'https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExOHpjcHRjZnhwMWw2Z3F5MWZ6M3J4MW5qeG94NHJ4OW9qeHg4OW1wayZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/9oyx89v84D0Y/giphy.gif'
      ]
    },
    cafune: {
      phrases: [
        '**{sender}** está fazendo um cafuné relaxante em **{target}**. *"Bom menino(a)... merece todo o meu carinho."* ✨',
        '**{sender}** acaricia suavemente os cabelos de **{target}**. Que momento fofo! 🌸'
      ],
      gifs: [
        'https://media.giphy.com/media/3o7TKSjRrfIPjeiVyM/giphy.gif'
      ]
    },
    socar: {
      phrases: [
        '**{sender}** perdeu a paciência e deu um soco divertido em **{target}**! *"Ei! Preste atenção em mim!"* 💢',
        'POW! **{sender}** acertou **{target}**. *"Isso é para aprender a não me ignorar, Darling!"* 👊'
      ],
      gifs: [
        'https://media.giphy.com/media/3oKIPnAiaMCws8nOsE/giphy.gif'
      ]
    },
    tapa: {
      phrases: [
        '**{sender}** desferiu um tapa estalado em **{target}**! *"Acorde para a realidade, Darling!"* 👋',
        'Um tapa marcante de **{sender}** em **{target}**. Quem mandou provocar a **Zero Two**? 🔥'
      ],
      gifs: [
        'https://media.giphy.com/media/3oKIPnAiaMCws8nOsE/giphy.gif'
      ]
    },
    flertar: {
      phrases: [
        '**{sender}** olhou fundo nos olhos de **{target}** e sussurrou: *"Quer pilotar a Strelizia comigo hoje à noite?"* 😏',
        '**{sender}** lançou um flerte irresistível para **{target}**. O clima esquentou no Garden! 🔥'
      ],
      gifs: [
        'https://media.giphy.com/media/ique71N0Wc0E0/giphy.gif'
      ]
    }
  };

  static async executeInteraction(action: string, senderId: string, targetId: string, senderName: string, targetName: string, guildId: string): Promise<ZeroTwoEmbed> {
    const config = this.interactionConfig[action] || {
      phrases: ['**{sender}** interagiu com **{target}** de forma misteriosa!'],
      gifs: ['https://media.giphy.com/media/ique71N0Wc0E0/giphy.gif']
    };

    const randomPhrase = config.phrases[Math.floor(Math.random() * config.phrases.length)];
    const randomGif = config.gifs[Math.floor(Math.random() * config.gifs.length)];

    const description = randomPhrase
      .replace('{sender}', senderName)
      .replace('{target}', targetName);

    // Recompensa em Coins (100k a 250k conforme pedido pelo Darling)
    const reward = Math.floor(Math.random() * (250000 - 100000 + 1)) + 100000;
    await EconomyService.addCoins(senderId, guildId, reward, `Interação Social: ${action}`);

    // Sistema de Afinidade (Aumenta se houver relacionamento)
    const rel = await RelationshipModel.findOne({
      guildId,
      $or: [
        { user1Id: senderId, user2Id: targetId },
        { user1Id: targetId, user2Id: senderId }
      ],
      status: 'active'
    });

    let affinityBonus = '';
    if (rel) {
      rel.affinity = (rel.affinity || 0) + 1;
      await rel.save();
      affinityBonus = `\n\n💞 **Afinidade do Casal:** ${rel.affinity}`;
    }

    const embed = new ZeroTwoEmbed()
      .setDescription(`${Emojis.seta} ${description}\n\n${Emojis.coin} **Recompensa:** \`${reward.toLocaleString()}\` D-Coins${affinityBonus}\n\n[` + '`' + `Visualizar Momento` + '`' + `](<${randomGif}>)`)
      .setImage(randomGif);

    return embed;
  }
}
