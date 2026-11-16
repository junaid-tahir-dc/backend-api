import { Injectable, Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Prisma, Role, User, UserStatus } from '@prisma/client';
import { UsersRepository } from './users.repository';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ActivateAccountDto } from './dto/activate-account.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UserResponseDto } from './dto/user-response.dto';
import {
  PaginatedResponseDto,
  PaginationQueryDto,
} from '../../common/dto/pagination-query.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { AppException } from '../../exceptions/app.exception';
import { MailService } from '../../mail/mail.service';
import {
  generateTempAccessKey,
  hashTempAccessKey,
} from '../../common/utils/temp-access.util';
import { ResponseMessage } from '../../common/constants/response-messages';

export type SafeUser = Omit<
  User,
  'passwordHash' | 'tempAccessKey' | 'tempAccessExpiresAt'
>;

const BCRYPT_ROUNDS = 10;
const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000; // 1 hour
const DUPLICATE_EMAIL = 'An account with this email address already exists.';
const SORTABLE_FIELDS = [
  'createdAt',
  'firstName',
  'lastName',
  'email',
  'role',
  'status',
] as const;

const userSelect = {
  id: true,
  email: true,
  phone: true,
  firstName: true,
  lastName: true,
  role: true,
  title: true,
  status: true,
  createdBy: true,
  createdAt: true,
};

function toSafeUser(user: User): SafeUser {
  const { passwordHash, ...safe } = user;
  return safe;
}

function toResponse(user: User): UserResponseDto {
  return new UserResponseDto({
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    title: user.title,
    status: user.status,
    createdBy: user.createdBy,
    createdAt: user.createdAt,
  });
}

function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    err.code === 'P2002'
  );
}

function validationError(message: string): AppException {
  return new AppException('VALIDATION_FAILED', { message });
}

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  // ---------------------------------------------------------------------------
  // CRUD
  // ---------------------------------------------------------------------------

  async create(
    dto: CreateUserDto,
    actorId?: string,
  ): Promise<{ user: UserResponseDto; activationEmailSent: boolean }> {
    const role = dto.role ?? Role.STAFF;

    // Only a SUPERADMIN may create anything above STAFF.
    if (role !== Role.STAFF) {
      if (!actorId) throw AppException.forbidden();
      const actor = await this.getActor(actorId);
      if (actor.role !== Role.SUPERADMIN) throw AppException.forbidden();
    }

    const email = dto.email.trim().toLowerCase();
    if (await this.usersRepository.findByEmail(email)) {
      throw AppException.duplicate(DUPLICATE_EMAIL);
    }

    const { rawAccessKey, hashedAccessKey, expiresAt } = generateTempAccessKey();

    let user: User;
    try {
      user = await this.prisma.user.create({
        data: {
          email,
          firstName: dto.firstName,
          lastName: dto.lastName,
          title: dto.title,
          role,
          status: UserStatus.PENDING,
          passwordHash: null,
          tempAccessKey: hashedAccessKey,
          tempAccessExpiresAt: expiresAt,
          createdBy: actorId,
          updatedBy: actorId,
        },
      });
    } catch (err) {
      // Covers the race where two requests pass the findByEmail check together.
      if (isUniqueViolation(err)) throw AppException.duplicate(DUPLICATE_EMAIL);
      throw err;
    }

    let activationEmailSent = false;
    try {
      await this.mailService.sendAccountActivation(email, rawAccessKey);
      activationEmailSent = true;
    } catch (err) {
      this.logger.error(
        `User ${email} created but activation email failed`,
        err instanceof Error ? err.stack : String(err),
      );
    }

 
    return { user: toResponse(user), activationEmailSent };
  }

  async findAll(
    query: PaginationQueryDto,
    actorId: string,
  ): Promise<PaginatedResponseDto<UserResponseDto>> {
    const actor = await this.getActor(actorId);

    // SUPERADMIN sees everyone; STAFF sees only non-superadmins they created.
    const scope: Prisma.UserWhereInput =
      actor.role === Role.SUPERADMIN
        ? {}
        : { role: { not: Role.SUPERADMIN }, createdBy: actor.id };

    const where: Prisma.UserWhereInput = {
      ...scope,
      isDeleted: false,
      ...(query.search && {
        OR: [
          { firstName: { contains: query.search, mode: 'insensitive' } },
          { lastName: { contains: query.search, mode: 'insensitive' } },
          { email: { contains: query.search, mode: 'insensitive' } },
        ],
      }),
    };

    const sortBy = SORTABLE_FIELDS.includes(query.sortBy as any)
      ? query.sortBy!
      : 'createdAt';

    const [items, totalItems] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        select: userSelect,
        skip: query.skip,
        take: query.limit,
        orderBy: { [sortBy]: query.sortOrder ?? 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return new PaginatedResponseDto(
      items.map((user) => new UserResponseDto(user)),
      totalItems,
      query.page,
      query.limit,
    );
  }

  async findOne(id: string): Promise<SafeUser> {
    return toSafeUser(await this.getTarget(id));
  }

  /** Used by the auth module for login. */
  findByEmailWithPassword(email: string): Promise<User | null> {
    return this.usersRepository.findByEmail(email.trim().toLowerCase());
  }

  async update(
    id: string,
    dto: UpdateUserDto,
    actorId: string,
  ): Promise<SafeUser> {
    const actor = await this.getActor(actorId);
    const target = await this.getTarget(id);

    if (actor.id !== target.id) this.assertCanManage(actor, target);
    if (dto.role !== undefined && actor.role !== Role.SUPERADMIN) {
      throw AppException.forbidden();
    }

    const email = dto.email?.trim().toLowerCase();
    if (email && email !== target.email) {
      const taken = await this.usersRepository.findByEmail(email);
      if (taken && taken.id !== id) throw AppException.duplicate(DUPLICATE_EMAIL);
    }

    let user: User;
    try {
      user = await this.usersRepository.update(id, {
        email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        title: dto.title,
        role: dto.role,
        updatedBy: actor.id,
      });
    } catch (err) {
      if (isUniqueViolation(err)) throw AppException.duplicate(DUPLICATE_EMAIL);
      throw err;
    }

    // Admin-triggered "reset password": email the user a reset link.
    if (dto.password && user.email) {
      const rawAccessKey = await this.issuePasswordResetToken(user.id);
      await this.mailService.sendForgotPassword(user.email, rawAccessKey);
    }

   
    return toSafeUser(user);
  }

  async updateStatus(
    id: string,
    dto: UpdateUserStatusDto,
    actorId: string,
  ): Promise<SafeUser> {
    const actor = await this.getActor(actorId);
    const target = await this.getTarget(id);
    this.assertCanManage(actor, target);

    if (target.status === dto.status) return toSafeUser(target);

    const updated = await this.usersRepository.update(id, {
      status: dto.status,
      updatedBy: actor.id,
    });

   

    return toSafeUser(updated);
  }

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<UserResponseDto> {
    const user = await this.getActor(userId);
    const data: Prisma.UserUpdateInput = {};

    if (dto.firstName !== undefined) {
      const value = dto.firstName.trim();
      if (!value) throw validationError('First name cannot be empty.');
      data.firstName = value;
    }

    if (dto.lastName !== undefined) {
      const value = dto.lastName.trim();
      if (!value) throw validationError('Last name cannot be empty.');
      data.lastName = value;
    }

    if (Object.keys(data).length === 0) {
      throw validationError('No fields to update.');
    }

    data.updatedBy = userId;
    const updated = await this.usersRepository.update(userId, data);

    const changes = [
      data.firstName !== undefined &&
        `firstName: ${user.firstName} -> ${updated.firstName}`,
      data.lastName !== undefined &&
        `lastName: ${user.lastName} -> ${updated.lastName}`,
    ]
      .filter(Boolean)
      .join(', ');



    return toResponse(updated);
  }

  /** Soft delete. SUPERADMIN: any non-superadmin. STAFF: only users they created. */
  async remove(id: string, actorId: string): Promise<{ message: string }> {
    const actor = await this.getActor(actorId);
    const target = await this.getTarget(id);

    if (target.id === actor.id || target.role === Role.SUPERADMIN) {
      throw AppException.forbidden();
    }
    this.assertCanManage(actor, target);

    await this.usersRepository.update(id, {
      isDeleted: true,
      isActive: false,
      updatedBy: actor.id,
    });

   

    return { message: ResponseMessage.deleted('User') };
  }

  // ---------------------------------------------------------------------------
  // Passwords & activation
  // ---------------------------------------------------------------------------

  /** Logged-in user sets a new password. */
  async resetPassword(userId: string, dto: ResetPasswordDto): Promise<SafeUser> {
    if (dto.newPassword !== dto.confirmPassword) {
      throw validationError('Passwords do not match.');
    }

    const user = await this.getActor(userId);
    if (!user.passwordHash) {
      throw validationError('No existing password to compare against.');
    }

    if (await bcrypt.compare(dto.newPassword, user.passwordHash)) {
      throw validationError('New password must be different from your current password.');
    }

    const updated = await this.usersRepository.update(userId, {
      passwordHash: await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS),
      updatedBy: userId,
    });

    if (updated.email) {
      this.mailService.sendPasswordChanged(updated.email).catch((err) =>
        this.logger.error(
          `Password changed but confirmation email failed for ${updated.email}`,
          err instanceof Error ? err.stack : String(err),
        ),
      );
    }


    return toSafeUser(updated);
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.usersRepository.findByEmail(email.trim().toLowerCase());

    // Return silently so the endpoint can't be used to discover which emails exist.
    if (!user || !user.email || user.isDeleted) return;

    const rawAccessKey = await this.issuePasswordResetToken(user.id);

    try {
      await this.mailService.sendForgotPassword(user.email, rawAccessKey);
    } catch (err) {
      this.logger.error(
        `Forgot-password email failed for ${user.email}`,
        err instanceof Error ? err.stack : String(err),
      );
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          tempAccessKey: null,
          tempAccessExpiresAt: null,
        },
      });
      throw new AppException('INTERNAL_ERROR', {
        message: 'We could not send the password reset email. Please try again later.',
      });
    }

  }

  async activateAccount(dto: ActivateAccountDto): Promise<SafeUser> {
    const invalidLink = 'Invalid or expired activation link.';

    if (dto.newPassword !== dto.confirmPassword) {
      throw validationError('Passwords do not match.');
    }

    const user = await this.usersRepository.findByEmail(dto.email.trim().toLowerCase());
    if (!user) throw validationError(invalidLink);
    if (user.status === UserStatus.ACTIVE) {
      throw validationError('This account has already been activated.');
    }

    const tokenHash = hashTempAccessKey(dto.token);
    if (!this.isTokenValid(user, tokenHash)) throw validationError(invalidLink);

    const activated = await this.usersRepository.activateAccountIfTokenValid({
      userId: user.id,
      tokenHash,
      now: new Date(),
      passwordHash: await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS),
    });
    if (!activated) throw validationError(invalidLink);

    const updated = await this.getTarget(user.id);

  
    return toSafeUser(updated);
  }

  /** Sets a new password using the token from the forgot-password email. */
  async changePassword(dto: ChangePasswordDto): Promise<{ message: string }> {
    const invalidLink = 'Invalid or expired password reset link.';

    if (dto.newPassword !== dto.confirmPassword) {
      throw validationError('Passwords do not match.');
    }

    const user = await this.usersRepository.findByEmail(dto.email.trim().toLowerCase());
    if (!user) throw validationError(invalidLink);

    const tokenHash = hashTempAccessKey(dto.token);
    if (!this.isTokenValid(user, tokenHash)) throw validationError(invalidLink);

    const updated = await this.usersRepository.resetPasswordIfTokenValid({
      userId: user.id,
      tokenHash,
      now: new Date(),
      passwordHash: await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS),
    });
    if (!updated) throw validationError(invalidLink);


    return { message: 'Password reset successfully.' };
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  /** The authenticated user making the request. */
  private async getActor(userId: string): Promise<User> {
    const user = await this.usersRepository.findById(userId);
    if (!user || user.isDeleted) throw new AppException('UNAUTHORIZED');
    return user;
  }

  /** The user being acted on. */
  private async getTarget(id: string): Promise<User> {
    const user = await this.usersRepository.findById(id);
    if (!user || user.isDeleted) throw AppException.notFound('User');
    return user;
  }

  /** SUPERADMIN can manage anyone; STAFF only users they created. */
  private assertCanManage(actor: User, target: User): void {
    if (actor.role === Role.SUPERADMIN) return;
    if (actor.role === Role.STAFF && target.createdBy === actor.id) return;
    throw AppException.forbidden('You do not have permission to manage this user.');
  }

  private isTokenValid(
    user: User & {
      tempAccessKey?: string | null;
      tempAccessExpiresAt?: Date | null;
    },
    tokenHash: string,
  ): boolean {
    return (
      !!user.tempAccessKey &&
      !!user.tempAccessExpiresAt &&
      user.tempAccessExpiresAt > new Date() &&
      user.tempAccessKey === tokenHash
    );
  }

  private async issuePasswordResetToken(userId: string): Promise<string> {
    const { rawAccessKey, hashedAccessKey } = generateTempAccessKey();

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        tempAccessKey: hashedAccessKey,
        tempAccessExpiresAt: new Date(Date.now() + PASSWORD_RESET_TTL_MS),
      },
    });

    return rawAccessKey;
  }

  // private audit(
  //   userId: string | undefined,
  //   entityId: string,
  //   action: string,
  //   details: string,
  // ) {
  //   return writeAuditLog(this.auditLogService, {
  //     userId: userId,
  //     module: 'USERS',
  //     entityId,
  //     action,
  //     details,
  //     ipAddress: null,
  //     userAgent: null,
  //   });
  // }
}