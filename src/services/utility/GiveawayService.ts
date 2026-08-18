import { Client, TextChannel, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } from 'discord.js';
import { GiveawayModel } from '../../database/models/Giveaway.js';
import { Emojis } from '../../utils/emojis.js';
import { logger } from '../../utils/logger.js';

export class GiveawayService {
  // Lista temporária de participantes armazenada em memória / banco
  private static participants: Map<string, Set<string>> = new Map(); // messageId -> Set of userIds

  static async addParticipant(messageId: string, userId: string): Promise<{ ok: boolean; reason?: string }> {
    const giveaway = await GiveawayModel.findOne({ messageId });
    if (!giveaway || giveaway.status !== 'active') {
      return { ok: false, reason: 'Este sorteio não está mais ativo.' };
    }
    if (new Date(giveaway.endsAt).getTime() <= Date.now()) {
      return { ok: false, reason: 'O período de participação deste sorteio já terminou.' };
    }

    const participants = new Set(giveaway.participants || []);
    if (participants.has(userId)) {
      return { ok: false, reason: 'Você já está participando deste sorteio.' };
    }

    participants.add(userId);
    giveaway.participants = [...participants];
    await giveaway.save();

    if (!this.participants.has(messageId)) {
      this.participants.set(messageId, new Set());
    }
    this.participants.get(messageId)!.add(userId);
    return { ok: true };
  }

  static async checkGiveaways(client: Client) {
    const now = new Date();
    const pending = await GiveawayModel.find({ status: 'active', endsAt: { $lte: now } });

    for (const giveaway of pending) {
      try {
        const guild = await client.guilds.fetch(giveaway.guildId);
        const channel = await guild.channels.fetch(giveaway.channelId) as TextChannel;
        const message = await channel.messages.fetch(giveaway.messageId);

        let candidates = Array.from(new Set([
          ...(giveaway.participants || []),
          ...Array.from(this.participants.get(giveaway.messageId) || []),
        ]));

        // Fallback: se não houver no Map em memória, checar reações antigas (compatibilidade)
        if (candidates.length === 0) {
          const reaction = message.reactions.cache.get('✅') || message.reactions.cache.first();
          if (reaction) {
            const users = await reaction.users.fetch();
            candidates = users.filter(u => !u.bot).map(u => u.id);
          }
        }

        if (candidates.length === 0) {
          const embed = new EmbedBuilder()
            .setColor(0xff3b69)
            .setTitle(`${Emojis.warning} Sorteio Encerrado`)
            .setDescription(`O sorteio de **${giveaway.prize}** terminou, mas não houve participantes válidos, Darling. 🦖💔`)
            .setTimestamp();
          await message.edit({ embeds: [embed], components: [] });
          giveaway.status = 'ended';
          await giveaway.save();
          continue;
        }

        const winners: string[] = [];
        for (let i = 0; i < giveaway.winnerCount && candidates.length > 0; i++) {
          const index = Math.floor(Math.random() * candidates.length);
          winners.push(candidates.splice(index, 1)[0]);
        }

        const winnersMention = winners.map(id => `<@${id}>`).join(', ');
        const endEmbed = new EmbedBuilder()
          .setColor(0xff3b69)
          .setTitle(`${Emojis.achievement} **${giveaway.title || 'SORTEIO DA ZERO TWO'}** ${Emojis.achievement}`)
          .setDescription(
            `🎁 **Prêmio:** \`${giveaway.prize}\`\n` +
            `👤 **Organizado por:** <@${giveaway.hostId}>\n` +
            `🏆 **Vencedores:** ${winnersMention}\n\n` +
            `Parabéns aos novos pilotos da Strelizia! 🦖🌸`
          )
          .setTimestamp();

        if (giveaway.image) endEmbed.setImage(giveaway.image);

        await message.edit({ embeds: [endEmbed], components: [] });
        await channel.send({ content: `🏆 Parabéns ${winnersMention}! Vocês ganharam o sorteio de **${giveaway.prize}**!` });

        giveaway.status = 'ended';
        giveaway.winners = winners;
        await giveaway.save();
        this.participants.delete(giveaway.messageId);
      } catch (err: any) {
        logger.error(`[GiveawayService] Erro ao finalizar sorteio ${giveaway.messageId}:`, err.message);
        giveaway.status = 'ended';
        await giveaway.save();
      }
    }
  }
}
