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

  await prisma.owner.upsert({
    where: { email: normalizedEmail },
    update: {},
    create: {
      email: normalizedEmail,
      password: passwordHash,
    },
  });

  const restaurantCount = await prisma.restaurant.count();

  if (restaurantCount === 0) {
    await prisma.restaurant.create({
      data: {
        name: 'Abol Coffee',
        description: 'Premium Ethiopian coffee and café menu.',
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
