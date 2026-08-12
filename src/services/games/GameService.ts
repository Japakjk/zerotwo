import { EconomyService } from '../economy/EconomyService.js';

export class GameService {
  private static activeGames = new Map<string, any>();

  static async startMines(userId: string, guildId: string, bet: number, minesCount: number) {
    const success = await EconomyService.removeCoins(userId, guildId, bet);
    if (!success) return null;

    const grid = Array(25).fill('diamond');
    let placedMines = 0;
    while (placedMines < minesCount) {
      const idx = Math.floor(Math.random() * 25);
      if (grid[idx] !== 'mine') {
        grid[idx] = 'mine';
        placedMines++;
      }
    }

    const gameState = {
      userId,
      guildId,
      bet,
      minesCount,
      grid,
      revealed: Array(25).fill(false),
      diamondsFound: 0,
      isFinished: false
    };

    this.activeGames.set(`${userId}-${guildId}-mines`, gameState);
    return gameState;
  }

  static getMinesState(userId: string, guildId: string) {
    return this.activeGames.get(`${userId}-${guildId}-mines`);
  }

  static finishMines(userId: string, guildId: string) {
    this.activeGames.delete(`${userId}-${guildId}-mines`);
  }

  static calculateMinesMultiplier(mines: number, diamonds: number): number {
    if (diamonds === 0) return 0;
    let multiplier = 1;
    for (let i = 0; i < diamonds; i++) {
      multiplier *= (25 - i) / (25 - mines - i);
    }
    return parseFloat((multiplier * 0.98).toFixed(2)); // 2% house edge
  }
}
