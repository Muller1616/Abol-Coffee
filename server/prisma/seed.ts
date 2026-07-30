import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, RestaurantStatus } from '../src/generated/prisma/client.js';
import { createDefaultOpeningHours } from '../src/types/openingHours.js';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required to run the seed script');
}

const ownerEmail = process.env.OWNER_EMAIL ?? 'owner@abolcoffee.com';
const ownerPassword = process.env.OWNER_PASSWORD ?? 'ChangeMe123!';

const adapter = new PrismaPg({ connectionString: databaseUrl });
const prisma = new PrismaClient({ adapter });

async function main(): Promise<void> {
  const passwordHash = await bcrypt.hash(ownerPassword, 12);
  const normalizedEmail = ownerEmail.trim().toLowerCase();

  const existingByEmail = await prisma.owner.findUnique({
    where: { email: normalizedEmail },
  });
  const anyOwner = await prisma.owner.findFirst({
    orderBy: { createdAt: 'asc' },
  });

  if (existingByEmail) {
    await prisma.owner.update({
      where: { id: existingByEmail.id },
      data: { password: passwordHash },
    });
  } else if (anyOwner) {
    await prisma.owner.update({
      where: { id: anyOwner.id },
      data: {
        email: normalizedEmail,
        password: passwordHash,
      },
    });
  } else {
    await prisma.owner.create({
      data: {
        email: normalizedEmail,
        password: passwordHash,
      },
    });
  }

  const restaurantCount = await prisma.restaurant.count();

  if (restaurantCount === 0) {
    await prisma.restaurant.create({
      data: {
        name: 'Abol Coffee',
        description: 'Premium Ethiopian coffee and café menu.',
        phone: '+251 11 123 4567',
        address: 'Bole Road, Addis Ababa, Ethiopia',
        status: RestaurantStatus.ACTIVE,
        openingHours: createDefaultOpeningHours(),
      },
    });
  }

  console.log(`Seed complete. Owner email: ${normalizedEmail}`);
}

main()
  .catch((error: unknown) => {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
