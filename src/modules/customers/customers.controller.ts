import {
  Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { SuccessMessage } from '../../common/decorators/success-message.decorator';
import { ResponseMessage } from '../../common/constants/response-messages';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { CustomersService } from './customers.service';
import { CustomerQueryDto } from './dto/customer-query.dto';
import { UpdateCustomerDto } from './dto/update-customer';

@ApiTags('customers')
@ApiBearerAuth()
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @SuccessMessage(ResponseMessage.created('Customer'))
  create(@Body() dto: CreateCustomerDto) {
    return this.customersService.create(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get()
  @SuccessMessage(ResponseMessage.list('customers'))
  findAll(@Query() query: CustomerQueryDto) {
    return this.customersService.findAll(query);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get(':id')
  @SuccessMessage(ResponseMessage.get('Customer'))
  findOne(@Param('id') id: string) {
    return this.customersService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @SuccessMessage(ResponseMessage.updated('Customer'))
  update(@Param('id') id: string, @Body() dto: UpdateCustomerDto) {
    return this.customersService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Delete(':id')
  @SuccessMessage(ResponseMessage.deleted('Customer'))
  remove(@Param('id') id: string) {
    return this.customersService.remove(id);
  }
}