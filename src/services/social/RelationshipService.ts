import { RelationshipModel, IRelationship, RelationshipType } from '../../database/models/Relationship.js';

export class RelationshipService {
  static async getRelationship(userId: string, guildId: string): Promise<IRelationship | null> {
    return await RelationshipModel.findOne({
      guildId,
      $or: [{ user1Id: userId }, { user2Id: userId }],
      status: 'active'
    });
  }

  static async getPendingProposal(userId: string, guildId: string): Promise<IRelationship | null> {
    return await RelationshipModel.findOne({
      guildId,
      user2Id: userId,
      status: 'pending'
    });
  }

  static async propose(fromId: string, toId: string, guildId: string, type: RelationshipType = 'namorando'): Promise<{ success: boolean; message: string }> {
    if (fromId === toId) return { success: false, message: 'Você não pode namorar consigo mesmo, Darling!' };

    const existing1 = await this.getRelationship(fromId, guildId);
    if (existing1) return { success: false, message: 'Você já está em um relacionamento!' };

    const existing2 = await this.getRelationship(toId, guildId);
    if (existing2) return { success: false, message: 'Este Darling já está comprometido com outra pessoa!' };

    const pending = await RelationshipModel.findOne({ guildId, user1Id: fromId, status: 'pending' });
    if (pending) return { success: false, message: 'Você já tem um pedido pendente. Aguarde ou cancele-o.' };

    await RelationshipModel.create({
      guildId,
      user1Id: fromId,
      user2Id: toId,
      type,
      status: 'pending'
    });

    return { success: true, message: 'Pedido enviado com sucesso!' };
  }

  static async accept(userId: string, guildId: string): Promise<{ success: boolean; partnerId?: string }> {
    const proposal = await this.getPendingProposal(userId, guildId);
    if (!proposal) return { success: false };

    await RelationshipModel.updateOne(
      { guildId: proposal.guildId, user1Id: proposal.user1Id, user2Id: proposal.user2Id },
      { $set: { status: 'active', startedAt: new Date() } }
    );

    return { success: true, partnerId: proposal.user1Id };
  }

  static async decline(userId: string, guildId: string): Promise<boolean> {
    const proposal = await this.getPendingProposal(userId, guildId);
    if (!proposal) return false;

    await RelationshipModel.deleteOne({ guildId: proposal.guildId, user1Id: proposal.user1Id, user2Id: proposal.user2Id });
    return true;
  }

  static async breakUp(userId: string, guildId: string): Promise<boolean> {
    const relationship = await this.getRelationship(userId, guildId);
    if (!relationship) return false;

    await RelationshipModel.deleteOne({ guildId: relationship.guildId, user1Id: relationship.user1Id, user2Id: relationship.user2Id });
    return true;
  }
}
