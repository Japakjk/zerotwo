export class MaintenanceService {
  private static enabled = false;

  static isEnabled(): boolean {
    return this.enabled;
  }

  static setEnabled(value: boolean): void {
    this.enabled = value;
  }

  static canUseBot(userId?: string): boolean {
    if (!this.enabled) return true;

    if (!userId) return false;
    return userId === process.env.OWNER_ID;
  }
}
