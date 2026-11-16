import { Body, Controller, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { SuccessMessage } from '../../common/decorators/success-message.decorator';
import { ResponseMessage } from '../../common/constants/response-messages';
import { RequestMagicLinkDto } from './dto/request-magic-link.dto';
import { RefreshDto } from './dto/refresh-token.dto';
import { VerifyMagicLinkDto } from './dto/verify-magic-link.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @SuccessMessage(ResponseMessage.loginSuccess())
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @SuccessMessage(ResponseMessage.tokenRefreshed())
  refresh(@Body() dto: RefreshDto) {
    return this.authService.refresh(dto.refreshToken);
  }

}
