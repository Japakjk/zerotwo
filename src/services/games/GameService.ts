import { EconomyService } from '../economy/EconomyService.js';
import { Emojis } from '../../utils/emojis.js';

export class GameService {
  private static activeGames = new Map<string, any>();

  // --- MINES ---
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

  // --- CRASH ---
  static async processCrash(userId: string, guildId: string, bet: number, autoCashout?: number) {
    const success = await EconomyService.removeCoins(userId, guildId, bet);
    if (!success) return null;

    // Gera o ponto de crash (probabilidade logarítmica)
    const crashPoint = Math.max(1.0, parseFloat((0.99 / (1 - Math.random())).toFixed(2)));
    
    return { crashPoint, bet };
  }

  // --- SLOTS ---
  static async playSlots(userId: string, guildId: string, bet: number) {
    const success = await EconomyService.removeCoins(userId, guildId, bet);
    if (!success) return null;

    const icons = ['🍒', '🍋', '🍇', '💎', '7️⃣', '🦖'];
    const result = [
      icons[Math.floor(Math.random() * icons.length)],
      icons[Math.floor(Math.random() * icons.length)],
      icons[Math.floor(Math.random() * icons.length)]
    ];

    let multiplier = 0;
    if (result[0] === result[1] && result[1] === result[2]) {
      // Jackpot 3 iguais
      multiplier = result[0] === '🦖' ? 10 : 5;
    } else if (result[0] === result[1] || result[1] === result[2] || result[0] === result[2]) {
      // 2 iguais
      multiplier = 1.5;
    }

    const win = Math.floor(bet * multiplier);
    if (win > 0) {
      await EconomyService.addCoins(userId, guildId, win, 'Venceu no Slots');
    }

    return { result, win, multiplier };
  }

  // --- COINFLIP ---
  static async playCoinflip(userId: string, guildId: string, bet: number, side: 'cara' | 'coroa') {
    const success = await EconomyService.removeCoins(userId, guildId, bet);
    if (!success) return null;

    const result = Math.random() < 0.5 ? 'cara' : 'coroa';
    const won = result === side;
    const win = won ? bet * 2 : 0;

    if (won) {
      await EconomyService.addCoins(userId, guildId, win, 'Venceu no Coinflip');
    }

    return { result, win, won };
  }
}
