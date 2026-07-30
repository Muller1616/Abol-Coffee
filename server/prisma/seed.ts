import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, RestaurantStatus } from '../src/generated/prisma/client.js';
import { createDefaultOpeningHours } from '../src/types/openingHours.js';
import {
  generatePublicMenuToken,
  slugifyRestaurantName,
} from '../src/utils/restaurantIdentity.js';

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

  let ownerId: string;

  if (existingByEmail) {
    const updated = await prisma.owner.update({
      where: { id: existingByEmail.id },
      data: { password: passwordHash },
    });
    ownerId = updated.id;
  } else if (anyOwner) {
    const updated = await prisma.owner.update({
      where: { id: anyOwner.id },
      data: {
        email: normalizedEmail,
        password: passwordHash,
      },
    });
    ownerId = updated.id;
  } else {
    const created = await prisma.owner.create({
      data: {
        email: normalizedEmail,
        password: passwordHash,
      },
    });
    ownerId = created.id;
  }

  const restaurantCount = await prisma.restaurant.count();

  if (restaurantCount === 0) {
    const name = 'Abol Coffee';
    await prisma.restaurant.create({
      data: {
        name,
        slug: slugifyRestaurantName(name),
        publicMenuToken: generatePublicMenuToken(),
        ownerId,
        description: 'Premium Ethiopian coffee and café menu.',
        phone: '+251 11 123 4567',
        address: 'Bole Road, Addis Ababa, Ethiopia',
        city: 'Addis Ababa',
        country: 'Ethiopia',
        latitude: 9.0192,
        longitude: 38.7525,
        status: RestaurantStatus.ACTIVE,
        openingHours: createDefaultOpeningHours(),
      },
    });
  } else {
    const restaurant = await prisma.restaurant.findFirst({
      orderBy: { createdAt: 'asc' },
    });
    if (restaurant && (!restaurant.ownerId || restaurant.ownerId !== ownerId)) {
      await prisma.restaurant.update({
        where: { id: restaurant.id },
        data: { ownerId },
      });
    }
  }

  const restaurant = await prisma.restaurant.findUnique({ where: { ownerId } });
  console.log(`Seed complete. Owner email: ${normalizedEmail}`);
  if (restaurant) {
    console.log(`Restaurant slug: /${restaurant.slug}/dashboard`);
    console.log(`Public menu: /menu/${restaurant.publicMenuToken}`);
  }
}

main()
  .catch((error: unknown) => {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
