import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { User, UserStatus } from '@prisma/client';
import { UsersService } from '../users/users.service';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { AppException } from '../../exceptions/app.exception';
import { parseTtlToMs } from '../../common/utils/auth.util';
import { PrismaService } from '../../prisma/prisma.service';

const DUMMY_HASH = bcrypt.hashSync('dummy-password-for-timing', 10);

@Injectable()
export class AuthService {
  private readonly refreshSecret: string;
  private readonly refreshTtl: string;

  constructor(
    private readonly usersService: UsersService,

    private readonly jwtService: JwtService,
 
    private readonly prisma: PrismaService,
    configService: ConfigService,
  ) {
 
    this.refreshSecret = configService.getOrThrow<string>('JWT_REFRESH_SECRET');
    this.refreshTtl = configService.get<string>('JWT_REFRESH_TTL') ?? '7d';
  }

  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.usersService.findByEmailWithPassword(email);

    const passwordValid = await bcrypt.compare(
      password,
      user?.passwordHash ?? DUMMY_HASH,
    );

    if (!user || !user.passwordHash || !passwordValid || !this.canLogIn(user)) {
      throw AppException.invalidCredentials();
    }

    return user;
  }

  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

   

    return {
      ...this.issueTokens(user),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        status: user.status,
      },
    };
  }

  async refresh(refreshToken: string) {
    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: this.refreshSecret,
      });
    } catch (err) {
      if ((err as Error).name === 'TokenExpiredError') {
        throw new AppException('TOKEN_EXPIRED');
      }
      throw new AppException('UNAUTHORIZED', { message: 'Invalid refresh token.' });
    }

  
    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || !this.canLogIn(user)) {
      throw new AppException('UNAUTHORIZED', { message: 'Invalid refresh token.' });
    }

    return this.issueTokens(user);
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private canLogIn(user: User): boolean {
    return (
      !user.isDeleted &&
      user.isActive &&
      user.status === UserStatus.ACTIVE &&
      !!user.email
    );
  }

  /** Same payload for login and refresh, so tokens always carry the same claims. */
  private issueTokens(user: User) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email!,
      firstName: user.firstName ?? '',
      lastName: user.lastName ?? '',
      role: user.role,
      secondaryRole: null,
    
    };

    return {
      accessToken: this.jwtService.sign(payload),
      refreshToken: this.jwtService.sign(payload, {
        secret: this.refreshSecret,
        expiresIn: this.refreshTtl,
      }),
      expiresAt: new Date(Date.now() + parseTtlToMs(this.refreshTtl)).toISOString(),
    };
  }
}