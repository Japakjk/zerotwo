import { Message, PermissionFlagsBits, TextChannel } from 'discord.js';

export class AutoModService {
  private static inviteRegex = /(discord\.(gg|io|me|li)|discordapp\.com\/invite)\/.+/i;

  static async checkMessage(message: Message): Promise<boolean> {
    if (!message.guild || message.author.bot || message.member?.permissions.has(PermissionFlagsBits.ManageMessages)) return false;

    // Anti-Invite
    if (this.inviteRegex.test(message.content)) {
      await message.delete().catch(() => {});
      if (message.channel instanceof TextChannel) {
        await message.channel.send(`Ei **${message.author.username}**, não envie convites aqui! A Zero Two está de olho. 🦖💢`)
          .then(m => setTimeout(() => m.delete().catch(() => {}), 5000));
      }
      return true;
    }

    return false;
  }
}
