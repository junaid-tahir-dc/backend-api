
import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import {
  PaginatedResponseDto,
  PaginationQueryDto,
} from '../../common/dto/pagination-query.dto';

import { CustomersRepository } from './customers.repository';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { CustomerResponseDto } from './dto/customer-response.dto';
import { UpdateCustomerDto } from './dto/update-customer';

@Injectable()
export class CustomersService {
  constructor(
    private readonly customersRepository: CustomersRepository,
  ) {}

  async create(dto: CreateCustomerDto) {
    const { ...customerData } = dto;

const customer  = await this.customersRepository.create({
      firstName: customerData.firstName!,
      lastName: customerData.lastName!,
      ...(customerData.phone !== undefined && { phone: customerData.phone }),
      ...(customerData.email !== undefined && { email: customerData.email }),
   
    });
  return customer;
  }

  async findAll(
    query: PaginationQueryDto,
    practiceId?: string,
  ): Promise<PaginatedResponseDto<CustomerResponseDto>> {
    const where: Prisma.CustomerWhereInput = {
      isDeleted: false,
      ...(query.search && {
        OR: [
          {
            firstName: {
              contains: query.search,
              mode: 'insensitive',
            },
          },
          {
            lastName: {
              contains: query.search,
              mode: 'insensitive',
            },
          },
          {
            phone: {
              contains: query.search,
              mode: 'insensitive',
            },
          },
          {
            email: {
              contains: query.search,
              mode: 'insensitive',
            },
          },
        ],
      }),
    };

    const { items, totalItems } =
      await this.customersRepository.findAll(where, query);

    return new PaginatedResponseDto(
      items.map((item) => new CustomerResponseDto(item)),
      totalItems,
      query.page,
      query.limit,
    );
  }

  async findOne(id: string): Promise<CustomerResponseDto> {
    const customer = await this.customersRepository.findById(id);

    if (!customer) {
      throw new NotFoundException('The requested customer could not be found.');
    }

    return new CustomerResponseDto(customer);
  }

  async update(
    id: string,
    dto: UpdateCustomerDto,
  ): Promise<CustomerResponseDto> {
    await this.findOne(id);

    const customer = await this.customersRepository.update(id, dto);
  
    return new CustomerResponseDto(customer);
  }

  async remove(id: string): Promise<void> {
  var customer = await this.findOne(id);
 
    await this.customersRepository.delete(id);
   
  }
}
