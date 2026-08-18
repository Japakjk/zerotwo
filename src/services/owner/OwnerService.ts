export class OwnerService {
  static readonly defaultOwnerIds = ['554833756431712267'];

  static getOwnerIds(): string[] {
    const configured = process.env.OWNER_ID;
    return configured ? [configured] : this.defaultOwnerIds;
  }

  static isOwner(userId?: string): boolean {
    if (!userId) return false;
    return this.getOwnerIds().includes(userId);
  }
}
