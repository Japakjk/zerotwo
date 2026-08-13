const DASHBOARD_URL = (process.env.DASHBOARD_API_URL || 'https://zerotwodash-ktrwzfex.manus.space').replace(/\/$/, '');
const BOT_API_KEY = process.env.BOT_API_KEY || 'zero_two_secure_railway_key_2026';

function dashboardHeaders() {
  return {
    Authorization: `Bearer ${BOT_API_KEY}`,
    'Content-Type': 'application/json',
  };
}

export class DashboardService {
  static async getGuildConfig(guildId: string) {
    try {
      const response = await fetch(`${DASHBOARD_URL}/api/bot/guild-config/${encodeURIComponent(guildId)}`, {
        headers: dashboardHeaders(),
      });
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      return await response.json();
    } catch (error: any) {
      console.error(`[DashboardBridge] Erro ao buscar config da guilda ${guildId}:`, error.message);
      return {
        prefix: 'zero!',
        autoModEnabled: true,
        welcomeEnabled: false,
        welcomeChannel: 'geral',
        welcomeMessage: 'Bem-vindo(a) {user} ao Garden!',
        autoRoleEnabled: false,
        antiRaidEnabled: false,
      };
    }
  }

  static async syncGuild(guild: { id: string; name: string; ownerId?: string; iconURL?: () => string | null }) {
    try {
      await fetch(`${DASHBOARD_URL}/api/bot/sync-guild`, {
        method: 'POST',
        headers: dashboardHeaders(),
        body: JSON.stringify({
          guildId: guild.id,
          guildName: guild.name,
          ownerDiscordId: guild.ownerId || '0',
          guildIcon: guild.iconURL?.() || null,
        }),
      });
    } catch (error: any) {
      console.error(`[DashboardBridge] Falha ao sincronizar guilda ${guild.id}:`, error.message);
    }
  }

  static async reportCommandUsage(guildId: string, commandName: string, userId: string) {
    try {
      await fetch(`${DASHBOARD_URL}/api/bot/command-metric`, {
        method: 'POST',
        headers: dashboardHeaders(),
        body: JSON.stringify({
          guildId,
          commandName,
          userId,
        }),
      });
    } catch (error: any) {
      console.error(`[DashboardBridge] Falha ao registrar métrica de comando ${commandName}:`, error.message);
    }
  }
}
