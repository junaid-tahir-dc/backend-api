import { Exclude, Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import {UserStatus } from '@prisma/client';

@Exclude()
export class UserResponseDto {
  @Expose()
  @ApiProperty()
  id!: string;

  @Expose()
  @ApiProperty({ nullable: true })
  email!: string | null;

  @Expose()
  @ApiProperty({ nullable: true })
  firstName!: string | null;

  @Expose()
  @ApiProperty({ nullable: true })
  lastName!: string | null;

  @Expose()
  @ApiProperty()
  role!: string;

  @Expose()
  @ApiProperty({ nullable: true, required: false })
  title?: string | null;

  @Expose()
  @ApiProperty({ enum: UserStatus })
  status!: UserStatus;

  @Expose()
  @ApiProperty()
  isTempPassword!: boolean;

  @Expose()
  @ApiProperty({ nullable: true, required: false })
  tempPasswordPlain?: string | null;

  @Expose()
  @ApiProperty({ nullable: true })
  practiceId!: string | null;

  @Expose()
  @ApiProperty({ nullable: true, required: false })
  createdBy?: string | null;

  @Expose()
  @ApiProperty()
  createdAt!: Date;

  constructor(partial: Partial<UserResponseDto>) {
    Object.assign(this, partial);
  }
}