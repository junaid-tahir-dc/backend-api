import { Injectable } from '@nestjs/common';
import { Customer, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

@Injectable()
export class CustomersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<Customer | null> {
    return this.prisma.customer.findUnique({
      where: { id },
     
    });
  }
async findAll(
  where: Prisma.CustomerWhereInput,
  query: PaginationQueryDto,
) {
  const customerSelect = {
    id: true,
    firstName: true,
    lastName: true,
    phone: true,
    email: true,
    isActive: true,
    createdAt: true,
    updatedAt: true,
  } satisfies Prisma.CustomerSelect;

  const [items, totalItems] = await this.prisma.$transaction([
    this.prisma.customer.findMany({
      where,
      select: customerSelect,
      skip: query.skip,
      take: query.limit,
      orderBy: {
        [query.sortBy ?? 'createdAt']: query.sortOrder ?? 'desc',
      },
    }),

    this.prisma.customer.count({ where }),
  ]);

  return {
    items,
    totalItems,
  };
}

  create(data: Prisma.CustomerCreateInput): Promise<Customer> {
    return this.prisma.customer.create({
      data,
     
    });
  }

  update(
    id: string,
    data: Prisma.CustomerUpdateInput,
  ): Promise<Customer> {
    return this.prisma.customer.update({
      where: { id },
      data,
    });
  }

  delete(id: string): Promise<Customer> {
    return this.prisma.customer.delete({
      where: { id },
    });
  }
  
}