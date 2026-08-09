import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';

/** Redis with in-memory fallback when the server is unreachable. */
@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;
  private memory = new Map<string, string>();
  private zsets = new Map<string, Map<string, number>>();
  private lists = new Map<string, string[]>();
  private useMemory = true;

  async onModuleInit() {
    const url = process.env.REDIS_URL ?? 'redis://localhost:6379';
    try {
      const redis = new Redis(url, {
        maxRetriesPerRequest: 1,
        lazyConnect: true,
        connectTimeout: 1500,
      });
      await redis.connect();
      await redis.ping();
      this.client = redis;
      this.useMemory = false;
      this.logger.log('Connected to Redis');
    } catch {
      this.logger.warn('Redis unavailable — using in-memory store');
      this.useMemory = true;
      if (this.client) {
        this.client.disconnect();
        this.client = null;
      }
    }
  }

  async onModuleDestroy() {
    if (this.client) await this.client.quit();
  }

  async get(key: string): Promise<string | null> {
    if (this.client && !this.useMemory) return this.client.get(key);
    return this.memory.get(key) ?? null;
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (this.client && !this.useMemory) {
      if (ttlSeconds) await this.client.set(key, value, 'EX', ttlSeconds);
      else await this.client.set(key, value);
      return;
    }
    this.memory.set(key, value);
    if (ttlSeconds) {
      setTimeout(() => this.memory.delete(key), ttlSeconds * 1000).unref?.();
    }
  }

  async del(key: string): Promise<void> {
    if (this.client && !this.useMemory) {
      await this.client.del(key);
      return;
    }
    this.memory.delete(key);
    this.zsets.delete(key);
    this.lists.delete(key);
  }

  async zadd(key: string, score: number, member: string): Promise<void> {
    if (this.client && !this.useMemory) {
      await this.client.zadd(key, score, member);
      return;
    }
    if (!this.zsets.has(key)) this.zsets.set(key, new Map());
    this.zsets.get(key)!.set(member, score);
  }

  async zrevrangeWithScores(key: string, start: number, stop: number): Promise<{ member: string; score: number }[]> {
    if (this.client && !this.useMemory) {
      const raw = await this.client.zrevrange(key, start, stop, 'WITHSCORES');
      const out: { member: string; score: number }[] = [];
      for (let i = 0; i < raw.length; i += 2) {
        out.push({ member: raw[i], score: Number(raw[i + 1]) });
      }
      return out;
    }
    const map = this.zsets.get(key) ?? new Map();
    return [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(start, stop + 1)
      .map(([member, score]) => ({ member, score }));
  }

  async zrevrank(key: string, member: string): Promise<number | null> {
    if (this.client && !this.useMemory) {
      return this.client.zrevrank(key, member);
    }
    const sorted = [...(this.zsets.get(key) ?? new Map()).entries()].sort((a, b) => b[1] - a[1]);
    const idx = sorted.findIndex(([m]) => m === member);
    return idx >= 0 ? idx : null;
  }

  async zcard(key: string): Promise<number> {
    if (this.client && !this.useMemory) return this.client.zcard(key);
    return this.zsets.get(key)?.size ?? 0;
  }

  async lpush(key: string, value: string): Promise<void> {
    if (this.client && !this.useMemory) {
      await this.client.lpush(key, value);
      return;
    }
    const list = this.lists.get(key) ?? [];
    list.unshift(value);
    this.lists.set(key, list);
  }

  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    if (this.client && !this.useMemory) return this.client.lrange(key, start, stop);
    const list = this.lists.get(key) ?? [];
    const end = stop < 0 ? list.length : stop + 1;
    return list.slice(start, end);
  }

  async lrem(key: string, count: number, value: string): Promise<void> {
    if (this.client && !this.useMemory) {
      await this.client.lrem(key, count, value);
      return;
    }
    const list = this.lists.get(key) ?? [];
    const filtered = list.filter((v) => v !== value);
    this.lists.set(key, filtered);
  }
}
