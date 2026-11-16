import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength, ValidateIf } from 'class-validator';
import { Role } from '@prisma/client';
export class CreateUserDto {
  @ApiProperty({ example: 'jane@example.com' })
  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email!: string;
@ApiProperty({
  example: 'Passw0rd!',
  minLength: 8,
  required: false,
  nullable: true,
})
@IsOptional()
@IsString()
@ValidateIf((_, value) => value?.trim() !== '')
@MinLength(8)
password?: string | null;

  @ApiProperty({ example: 'Jane', required: false })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiProperty({ example: 'Doe', required: false })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({
    enum: Role,
    example: Role.STAFF,
    required: false,
    default: Role.STAFF,
  })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @ApiProperty({
    example: 'PRACTICE_MANAGER',
    description: 'Title value (enum or custom text)',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  title?: string | null;

  @ApiProperty({ example: 'clx123practiceid', required: false })
  @IsOptional()
  @IsString()
  practiceId?: string;

  @ApiProperty({ example: 'clx123userid', required: false })
  @IsOptional()
  @IsString()
  createdBy?: string;
}