import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import type { AuthResponse } from '@quiz-rush/shared';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
  ) {}

  async guest(): Promise<AuthResponse> {
    const user = await this.users.createGuest();
    return this.tokenResponse(user.id);
  }

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const existing = await this.users.findByEmailOrUsername(dto.email, dto.username);
    if (existing) throw new ConflictException('Email ou username déjà pris');
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.users.createRegistered({
      email: dto.email,
      username: dto.username,
      passwordHash,
    });
    return this.tokenResponse(user.id);
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.users.findByLogin(dto.login);
    if (!user?.passwordHash) throw new UnauthorizedException('Identifiants invalides');
    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Identifiants invalides');
    return this.tokenResponse(user.id);
  }

  async claimGuest(userId: string, dto: RegisterDto): Promise<AuthResponse> {
    const existing = await this.users.findByEmailOrUsername(dto.email, dto.username);
    if (existing && existing.id !== userId) {
      throw new ConflictException('Email ou username déjà pris');
    }
    const passwordHash = await bcrypt.hash(dto.password, 10);
    await this.users.claimGuest(userId, {
      email: dto.email,
      username: dto.username,
      passwordHash,
    });
    return this.tokenResponse(userId);
  }

  private async tokenResponse(userId: string): Promise<AuthResponse> {
    const user = await this.users.toPublic(userId);
    const accessToken = await this.jwt.signAsync({ sub: userId });
    return { accessToken, user };
  }
}
