import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { JOKER_RECHARGE_HOURS, MAX_ADS_PER_DAY } from '@quiz-rush/shared';
import type { PublicUser } from '@quiz-rush/shared';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async createGuest() {
    const suffix = Math.random().toString(36).slice(2, 8);
    return this.prisma.user.create({
      data: {
        username: `Joueur_${suffix}`,
        isGuest: true,
      },
    });
  }

  async createRegistered(data: { email: string; username: string; passwordHash: string }) {
    return this.prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        username: data.username,
        passwordHash: data.passwordHash,
        isGuest: false,
      },
    });
  }

  async claimGuest(
    userId: string,
    data: { email: string; username: string; passwordHash: string },
  ) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        email: data.email.toLowerCase(),
        username: data.username,
        passwordHash: data.passwordHash,
        isGuest: false,
      },
    });
  }

  async findByEmailOrUsername(email: string, username: string) {
    return this.prisma.user.findFirst({
      where: {
        OR: [{ email: email.toLowerCase() }, { username }],
      },
    });
  }

  async findByLogin(login: string) {
    return this.prisma.user.findFirst({
      where: {
        OR: [{ email: login.toLowerCase() }, { username: login }],
      },
    });
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Utilisateur introuvable');
    return user;
  }

  async toPublic(userId: string): Promise<PublicUser> {
    const user = await this.maybeRechargeJokers(userId);
    return {
      id: user.id,
      username: user.username,
      level: user.level,
      xp: user.xp,
      gems: user.gems,
      streak: user.streak,
      isGuest: user.isGuest,
      isPremium: user.isPremium,
      jokers: {
        fifty_fifty: user.jokerFiftyFifty,
        time_bonus: user.jokerTimeBonus,
        community: user.jokerCommunity,
        nextRechargeAt: user.jokersRechargeAt?.toISOString() ?? null,
      },
    };
  }

  async maybeRechargeJokers(userId: string) {
    const user = await this.findById(userId);
    const now = new Date();
    const needs =
      user.jokerFiftyFifty < 1 || user.jokerTimeBonus < 1 || user.jokerCommunity < 1;

    if (!needs) return user;

    if (!user.jokersRechargeAt) {
      return this.prisma.user.update({
        where: { id: userId },
        data: {
          jokersRechargeAt: new Date(now.getTime() + JOKER_RECHARGE_HOURS * 3600_000),
        },
      });
    }

    if (user.jokersRechargeAt <= now) {
      return this.prisma.user.update({
        where: { id: userId },
        data: {
          jokerFiftyFifty: Math.max(user.jokerFiftyFifty, 1),
          jokerTimeBonus: Math.max(user.jokerTimeBonus, 1),
          jokerCommunity: Math.max(user.jokerCommunity, 1),
          jokersRechargeAt: null,
        },
      });
    }

    return user;
  }

  /** Stub: watch ad or spend gems to refill one joker type */
  async refillJoker(userId: string, type: 'fifty_fifty' | 'time_bonus' | 'community', method: 'ad' | 'gems') {
    const user = await this.findById(userId);
    if (method === 'gems') {
      if (user.gems < 100) throw new BadRequestException('Pas assez de gems');
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          gems: { decrement: 100 },
          ...(type === 'fifty_fifty' ? { jokerFiftyFifty: { increment: 1 } } : {}),
          ...(type === 'time_bonus' ? { jokerTimeBonus: { increment: 1 } } : {}),
          ...(type === 'community' ? { jokerCommunity: { increment: 1 } } : {}),
        },
      });
    } else {
      const today = new Date().toISOString().slice(0, 10);
      const reset = !user.adsResetDate || user.adsResetDate.toISOString().slice(0, 10) !== today;
      const watched = reset ? 0 : user.adsWatchedToday;
      if (watched >= MAX_ADS_PER_DAY) {
        throw new BadRequestException('Limite de pubs journalière atteinte');
      }
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          adsWatchedToday: watched + 1,
          adsResetDate: new Date(),
          ...(type === 'fifty_fifty' ? { jokerFiftyFifty: { increment: 1 } } : {}),
          ...(type === 'time_bonus' ? { jokerTimeBonus: { increment: 1 } } : {}),
          ...(type === 'community' ? { jokerCommunity: { increment: 1 } } : {}),
        },
      });
    }
    return this.toPublic(userId);
  }
}
