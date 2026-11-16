import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ActivateAccountDto } from './dto/activate-account.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { SuccessMessage } from '../../common/decorators/success-message.decorator';
import { ResponseMessage } from '../../common/constants/response-messages';

type AuthUser = { userId: string };

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
  ) {}


  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @SuccessMessage('If an account exists for this email, a reset link has been sent.')
  async forgotPassword(@Body() dto: ForgotPasswordDto): Promise<void> {
    await this.usersService.forgotPassword(dto.email);
  }

  @Post('activate-account')
  @HttpCode(HttpStatus.OK)
  @SuccessMessage('Account activated successfully.')
  activateAccount(@Body() dto: ActivateAccountDto) {
    return this.usersService.activateAccount(dto);
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @SuccessMessage('Password updated successfully.')
  changePassword(@Body() dto: ChangePasswordDto) {
    return this.usersService.changePassword(dto);
  }


  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('me')
  @SuccessMessage(ResponseMessage.get('Profile'))
  getMe(@CurrentUser() user: AuthUser) {
    return this.usersService.findOne(user.userId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch('me/profile')
  @SuccessMessage(ResponseMessage.updated('Profile'))
  updateMyProfile(@Body() dto: UpdateProfileDto, @CurrentUser() user: AuthUser) {
    return this.usersService.updateProfile(user.userId, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @SuccessMessage(ResponseMessage.updated('Password'))
  resetPassword(@Body() dto: ResetPasswordDto, @CurrentUser() user: AuthUser) {
    return this.usersService.resetPassword(user.userId, dto);
  }



  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post()
  @SuccessMessage(ResponseMessage.created('User'))
  create(@Body() dto: CreateUserDto, @CurrentUser() user: AuthUser) {
    return this.usersService.create(dto, user.userId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get()
  @SuccessMessage(ResponseMessage.list('Users'))
  findAll(@Query() query: PaginationQueryDto, @CurrentUser() user: AuthUser) {
    return this.usersService.findAll(query, user.userId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  @SuccessMessage(ResponseMessage.get('User'))
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.usersService.findOne(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @SuccessMessage(ResponseMessage.updated('User'))
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.usersService.update(id, dto, user.userId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch(':id/status')
  @SuccessMessage(ResponseMessage.updated('User status'))
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserStatusDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.usersService.updateStatus(id, dto, user.userId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @SuccessMessage(ResponseMessage.deleted('User'))
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ): Promise<void> {
    await this.usersService.remove(id, user.userId);
  }
}