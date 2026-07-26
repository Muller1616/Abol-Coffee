import 'dotenv/config';
import { prisma } from '../src/config/database.js';

async function main() {
  const categories = await prisma.category.findMany({
    include: {
      menuItems: true,
    },
    orderBy: {
      displayOrder: 'asc',
    },
  });

  console.log(`Found ${categories.length} categories in DB:`);
  for (const cat of categories) {
    console.log(`\nCategory [${cat.name}] (active: ${cat.isActive}, items: ${cat.menuItems.length}):`);
    for (const item of cat.menuItems) {
      console.log(`  - ${item.name} | ${item.price} ${item.currency} | available: ${item.isAvailable}`);
    }
  }
}

main()
  .catch((err) => {
    console.error('Error:', err);
  })
  .finally(() => {
    prisma.$disconnect();
  });
