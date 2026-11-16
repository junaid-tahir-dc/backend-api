import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const DEFAULT_PASSWORD = 'Passw0rd!';

type SeedUserRole = 'SUPERADMIN' | 'STAFF';
type SeedUser = {
  email: string;
  firstName: string;
  lastName: string;
  role: SeedUserRole;
  title?: string;
};

const USERS: SeedUser[] = [
  { email: 'superadmin@demo.com', firstName: 'Super', lastName: 'Admin', role: 'SUPERADMIN' },
  { email: 'staff@demo.com', firstName: 'Staff', lastName: 'User', role: 'STAFF' },
];

type SeedCustomer = {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
};

const CUSTOMERS: SeedCustomer[] = [
  { email: 'john.doe@example.com', firstName: 'John', lastName: 'Doe', phone: '+15550000001' },
  { email: 'jane.smith@example.com', firstName: 'Jane', lastName: 'Smith', phone: '+15550000002' },
];

async function seedUsers(): Promise<string | undefined> {
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);
  let superadminId: string | undefined;

  for (const u of USERS) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        title: u.title,
        passwordHash,
        role: u.role,
        status: 'ACTIVE',
        isActive: true,
        isDeleted: false,
      },
    });

    if (u.email === 'superadmin@demo.com') superadminId = user.id;
  }

  console.log(`Seeded ${USERS.length} users:`, USERS.map((u) => u.email));
  return superadminId;
}

async function seedCustomers(createdBy?: string) {
  for (const c of CUSTOMERS) {
    await prisma.customer.upsert({
      where: { email: c.email },
      update: {},
      create: {
        email: c.email,
        firstName: c.firstName,
        lastName: c.lastName,
        phone: c.phone,
        isActive: true,
        isDeleted: false,
        createdBy,
        updatedBy: createdBy,
      },
    });
  }

  console.log(`Seeded ${CUSTOMERS.length} customers.`);
}

async function main() {
  console.log('Starting database seed...');

  const superadminId = await seedUsers();
  await seedCustomers(superadminId);

  console.log('Database seed completed successfully.');
}

main()
  .catch((error) => {
    console.error('Database seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });