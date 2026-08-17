import { ZeroTwoEmbed } from '../../utils/embeds.js';
import { Emojis } from '../../utils/emojis.js';
import { EconomyService } from '../economy/EconomyService.js';
import { CooldownService } from '../economy/CooldownService.js';
import { RelationshipModel } from '../../database/models/Relationship.js';
import { SocialAffinityModel } from '../../database/models/SocialAffinity.js';
import { SocialGifs } from '../../utils/socialGifs.js';

export interface InteractionData {
  action: string;
  sender: string;
  target: string;
}

interface InteractionConfig {
  phrases: string[];
  gifs: string[];
}

interface AffinityUpdate {
  affinity: number;
  delta: number;
}

export class SocialService {
  private static interactionConfig: Record<string, InteractionConfig> = {
    beijar: {
      phrases: [
        '**{sender}** deu um beijo apaixonado em **{target}**! *"Você é meu único Darling, sabia?"*',
        'Um beijo doce e inesquecível de **{sender}** para **{target}**. A **Zero Two** aprova esse romance!',
        '**{sender}** beijou **{target}** intensamente! *"Tem gosto de mel... delicioso."*',
      ],
      gifs: [SocialGifs.beijar1, SocialGifs.beijar2, SocialGifs.beijar3],
    },
    abracar: {
      phrases: [
        '**{sender}** envolveu **{target}** em um abraço caloroso e apertado! *"Não vou te soltar nunca, Darling."*',
        'Um abraço repleto de carinho de **{sender}** em **{target}**. O **Garden** inteiro está torcendo por vocês!',
        '**{sender}** puxou **{target}** para um abraço protetor. *"Você é meu parceiro perfeito."*',
      ],
      gifs: [SocialGifs.abracar],
    },
    cafune: {
      phrases: [
        '**{sender}** está fazendo um cafuné relaxante em **{target}**. *"Merece todo o meu carinho, Darling."*',
        '**{sender}** acaricia suavemente os cabelos de **{target}**. Que momento fofo no Garden!',
      ],
      gifs: [SocialGifs.agarrar],
    },
    acariciar: {
      phrases: [
        '**{sender}** acariciou **{target}** com delicadeza. O momento ficou guardado no coração!',
        '**{sender}** fez um carinho em **{target}**. A Zero Two aprovou esse gesto gentil!',
      ],
      gifs: [SocialGifs.agarrar],
    },
    cosquinha: {
      phrases: [
        '**{sender}** fez cosquinhas em **{target}**! *"Não adianta fugir, Darling!"*',
        '**{target}** não conseguiu segurar o riso depois das cosquinhas de **{sender}**!',
      ],
      // O asset próprio de cosquinha ainda será fornecido; não reutilizamos um GIF incorreto.
      gifs: [],
    },
    socar: {
      phrases: [
        '**{sender}** perdeu a paciência e deu um soco divertido em **{target}**! *"Ei! Preste atenção em mim!"*',
        'POW! **{sender}** acertou **{target}**. *"Isso é para aprender a não me ignorar, Darling!"*',
      ],
      gifs: [SocialGifs.punicao, SocialGifs.raivaVermelho],
    },
    tapa: {
      phrases: [
        '**{sender}** desferiu um tapa estalado em **{target}**! *"Acorde para a realidade, Darling!"*',
        'Um tapa marcante de **{sender}** em **{target}**. Quem mandou provocar a **Zero Two**?',
      ],
      gifs: [SocialGifs.tapa, SocialGifs.punicao],
    },
    flertar: {
      phrases: [
        '**{sender}** olhou fundo nos olhos de **{target}** e sussurrou: *"Quer pilotar a Strelizia comigo hoje à noite?"*',
        '**{sender}** lançou um flerte irresistível para **{target}**. O clima esquentou no Garden!',
      ],
      gifs: [SocialGifs.agarrar, SocialGifs.beijar1],
    },
    dancar: {
      phrases: [
        '**{sender}** chamou **{target}** para dançar no Garden. Que sintonia!',
        '**{sender}** e **{target}** dançaram como dois pilotos em perfeita conexão!',
      ],
      gifs: [SocialGifs.abracar],
    },
    cumprimentar: {
      phrases: [
        '**{sender}** cumprimentou **{target}** com um sorriso. Olá, Darling!',
        '**{sender}** encontrou **{target}** no Garden e acenou com carinho!',
      ],
      gifs: [SocialGifs.abracar],
    },
    olhar: {
      phrases: [
        '**{sender}** trocou um olhar intenso com **{target}**. O silêncio disse tudo!',
        '**{sender}** ficou observando **{target}** com curiosidade e carinho.',
      ],
      gifs: [SocialGifs.agarrar],
    },
    provocar: {
      phrases: [
        '**{sender}** provocou **{target}** com um sorriso travesso. Cuidado, Darling!',
        '**{sender}** cutucou **{target}** só para ver a reação. A Zero Two está se divertindo!',
      ],
      gifs: [SocialGifs.raivaVermelho],
    },
  };

  private static normalizePair(firstId: string, secondId: string): [string, string] {
    return firstId < secondId ? [firstId, secondId] : [secondId, firstId];
  }

  private static randomAffinityDelta(): number {
    return (Math.floor(Math.random() * 81) + 120) / 100;
  }

  private static async updateAffinity(
    senderId: string,
    targetId: string,
    guildId: string,
    succeeded: boolean,
  ): Promise<AffinityUpdate> {
    const [user1Id, user2Id] = this.normalizePair(senderId, targetId);
    const delta = succeeded ? this.randomAffinityDelta() : 0;
    const now = new Date();
    const result = await SocialAffinityModel.findOneAndUpdate(
      { guildId, user1Id, user2Id },
      {
        $inc: {
          affinity: delta,
          successes: succeeded ? 1 : 0,
          failures: succeeded ? 0 : 1,
        },
        $set: {
          lastInteractionAt: now,
          updatedAt: now,
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    ).exec();

    let affinity = Math.min(100, Number(result?.affinity || delta));
    if (Number(result?.affinity || 0) > 100) {
      await SocialAffinityModel.updateOne(
        { guildId, user1Id, user2Id },
        { $set: { affinity: 100, updatedAt: now } },
      );
      affinity = 100;
    }
    if (succeeded) {
      const relationship = await RelationshipModel.findOne({
        guildId,
        status: 'active',
        $or: [
          { user1Id: senderId, user2Id: targetId },
          { user1Id: targetId, user2Id: senderId },
        ],
      }).exec();
      if (relationship?.user1Id && relationship.user2Id) {
        await RelationshipModel.updateOne(
          {
            guildId,
            user1Id: relationship.user1Id,
            user2Id: relationship.user2Id,
          },
          { $set: { affinity, updatedAt: now } },
        ).catch(() => undefined);
      }
    }

    return { affinity, delta };
  }

  static async getPairAffinity(userId: string, targetId: string, guildId: string): Promise<number> {
    const [user1Id, user2Id] = this.normalizePair(userId, targetId);
    const affinity = await SocialAffinityModel.findOne({ guildId, user1Id, user2Id }).exec();
    return Math.min(100, Number(affinity?.affinity || 0));
  }

  static async executeInteraction(
    action: string,
    senderId: string,
    targetId: string,
    senderName: string,
    targetName: string,
    guildId: string,
  ): Promise<ZeroTwoEmbed> {
    const config = this.interactionConfig[action] || {
      phrases: ['**{sender}** interagiu com **{target}** de forma misteriosa!'],
      gifs: [],
    };
    const succeeded = Math.random() < 0.5;
    const affinity = await this.updateAffinity(senderId, targetId, guildId, succeeded);

    // O cooldown é gravado aqui para que todos os wrappers sociais tenham a mesma regra.
    await CooldownService.setCooldown(senderId, guildId, action);

    if (!succeeded) {
      const failedEmbed = new ZeroTwoEmbed()
        .setTitle(`${Emojis.coracaoPartido} A interação não acertou`)
        .setDescription(
          `${Emojis.cry} **${targetName}** desviou da interação de **${senderName}**, Darling!\n\n` +
          `${Emojis.coracaoPartido} **Afinidade:** não aumentou desta vez. Total: **${affinity.affinity.toFixed(2)}%**\n\n` +
          `[\`Visualizar o momento\`](<${SocialGifs.desviou}>)`,
        )
        .setImage(SocialGifs.desviou);
      return failedEmbed;
    }

    const randomPhrase = config.phrases[Math.floor(Math.random() * config.phrases.length)];
    const randomGif = config.gifs.length > 0
      ? config.gifs[Math.floor(Math.random() * config.gifs.length)]
      : null;
    const description = randomPhrase
      .replace('{sender}', senderName)
      .replace('{target}', targetName);
    const reward = Math.floor(Math.random() * (250000 - 100000 + 1)) + 100000;
    await EconomyService.addCoins(senderId, guildId, reward, `Interação Social: ${action}`);

    const embed = new ZeroTwoEmbed()
      .setTitle(`${Emojis.mensagemCoracao} Interação certeira!`)
      .setDescription(
        `${Emojis.seta} ${description}\n\n` +
        `${Emojis.coin} **Recompensa:** \`${reward.toLocaleString()}\` D-Coins\n` +
        `${Emojis.fogoCoracao} **Afinidade com ${targetName}:** +${affinity.delta.toFixed(2)}% ` +
        `(total: **${affinity.affinity.toFixed(2)}%**)`,
      );

    if (randomGif) {
      embed.setDescription(`${embed.data.description}\n\n[\`Visualizar o momento\`](<${randomGif}>)`);
      embed.setImage(randomGif);
    }

    return embed;
  }
}
