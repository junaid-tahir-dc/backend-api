import { Injectable } from '@nestjs/common';
import { Prisma, User, UserStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

type TokenPasswordParams = {
  userId: string;
  tokenHash: string;
  now: Date;
  passwordHash: string;
};

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id, isDeleted: false } });
  }

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email, isDeleted: false } });
  }

  update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    return this.prisma.user.update({ where: { id }, data });
  }

  async softDelete(id: string, deletedBy: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { isDeleted: true, isActive: false, updatedBy: deletedBy },
    });
  }

  /** Sets the password and activates a PENDING account, only if the token is valid. */
  activateAccountIfTokenValid(params: TokenPasswordParams): Promise<boolean> {
    return this.setPasswordIfTokenValid(params, true);
  }

  /** Sets the password from a forgot-password link, only if the token is valid. */
  resetPasswordIfTokenValid(params: TokenPasswordParams): Promise<boolean> {
    return this.setPasswordIfTokenValid(params, false);
  }

  /**
   * Checks the token and writes the new password in one atomic query,
   * so the same link can't be used twice.
   */
  private async setPasswordIfTokenValid(
    params: TokenPasswordParams,
    activate: boolean,
  ): Promise<boolean> {
    const result = await this.prisma.user.updateMany({
      where: {
        id: params.userId,
        isDeleted: false,
        tempAccessKey: params.tokenHash,
        tempAccessExpiresAt: { gt: params.now },
        ...(activate && { status: { not: UserStatus.ACTIVE } }),
      },
      data: {
        passwordHash: params.passwordHash,
        tempAccessKey: null,
        tempAccessExpiresAt: null,
        updatedBy: params.userId,
        ...(activate && { status: UserStatus.ACTIVE }),
      },
    });

    return result.count === 1;
  }
}