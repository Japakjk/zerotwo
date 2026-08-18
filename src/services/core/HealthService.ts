import mongoose from 'mongoose';
import os from 'os';
import type { Client } from 'discord.js';

export interface BotHealthSnapshot {
  discordApiMs: number;
  websocketState: string;
  mongodbState: 'Connected' | 'Disconnected' | 'Connecting' | 'Disconnecting' | 'Unknown';
  mongodbLatencyMs: number | null;
  botUptimeMs: number;
  memoryMb: number;
  nodeVersion: string;
}

export class HealthService {
  static async getSnapshot(client: Client): Promise<BotHealthSnapshot> {
    const readyStateMap: Record<number, BotHealthSnapshot['mongodbState']> = {
      0: 'Disconnected',
      1: 'Connected',
      2: 'Connecting',
      3: 'Disconnecting',
    };

    let mongodbLatencyMs: number | null = null;
    if (mongoose.connection.readyState === 1 && mongoose.connection.db) {
      const startedAt = Date.now();
      try {
        await mongoose.connection.db.command({ ping: 1 });
        mongodbLatencyMs = Date.now() - startedAt;
      } catch {
        mongodbLatencyMs = null;
      }
    }

    const memoryMb = Math.round((process.memoryUsage().rss / 1024 / 1024) * 10) / 10;

    return {
      discordApiMs: client.ws.ping || 0,
      websocketState: client.ws.status === 1 ? 'Healthy' : `Status ${client.ws.status}`,
      mongodbState: readyStateMap[mongoose.connection.readyState] || 'Unknown',
      mongodbLatencyMs,
      botUptimeMs: client.uptime ?? 0,
      memoryMb,
      nodeVersion: process.version,
    };
  }

  static formatUptime(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const parts: string[] = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);

    return parts.join(' ');
  }
}
