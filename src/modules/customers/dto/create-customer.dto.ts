import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateCustomerDto {
  @ApiProperty({
    example: 'John',
  })
  @IsString()
  firstName: string | undefined;

  @ApiProperty({
    example: 'Smith',
  })
  @IsString()
  lastName: string | undefined;

  @ApiPropertyOptional({
    example: '+1234567890',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    example: 'john.smith@example.com',
  })
  @IsOptional()
  @IsEmail()
  email?: string;
}