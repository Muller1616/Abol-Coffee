import 'dotenv/config';
import { prisma } from '../src/config/database.js';

type ItemData = {
  name: string;
  description: string;
  price: number;
  currency?: string;
  isAvailable?: boolean;
};

type CategoryData = {
  name: string;
  displayOrder: number;
  items: ItemData[];
};

const menuData: CategoryData[] = [
  {
    name: 'Specialty Coffee & Espresso',
    displayOrder: 1,
    items: [
      {
        name: 'Traditional Jebena Coffee',
        description:
          'Aromatic traditional Ethiopian single-origin dark roast brewed in a clay Jebena with frankincense aroma.',
        price: 120,
      },
      {
        name: 'Ethiopian Layered Macchiato',
        description:
          'Rich double shot espresso layered with silky steamed milk in the iconic Ethiopian glass style.',
        price: 90,
      },
      {
        name: 'Yirgacheffe Pour-Over',
        description:
          'Single-origin specialty drip coffee featuring floral jasmine notes, bergamot citrus, and clean acidity.',
        price: 150,
      },
      {
        name: 'Tena’adam Spiced Espresso',
        description:
          'Bold espresso shot infused with fresh Ethiopian sacred herb (Rue / Tena’adam) for an herbal citrus aroma.',
        price: 110,
      },
      {
        name: 'Iced Vanilla Bean Latte',
        description:
          'Double espresso over cold milk, natural vanilla syrup, and crushed ice.',
        price: 140,
      },
      {
        name: 'Salted Caramel Cappuccino',
        description:
          'Creamy espresso topped with rich microfoam and house-made salted caramel drizzle.',
        price: 130,
      },
    ],
  },
  {
    name: 'Artisanal Breakfast',
    displayOrder: 2,
    items: [
      {
        name: 'Enkulal Firfir (Eggs & Injera)',
        description:
          'Scrambled eggs with sautéed red onions, fresh tomatoes, jalapeno, and toasted spiced injera crispies.',
        price: 250,
      },
      {
        name: 'Special Chechebsa',
        description:
          'Toasted Ethiopian flatbread shreds cooked in spiced niter kibbeh, berbere, and served with organic honey & fresh yogurt.',
        price: 220,
      },
      {
        name: 'Kinche (Ethiopian Crushed Wheat)',
        description:
          'Cracked wheat porridge simmered in golden spiced butter with cardamom, green chili, and fresh herbs.',
        price: 180,
      },
      {
        name: 'Avocado & Poached Egg Toast',
        description:
          'Creamy smashed Sidama avocado on sourdough topped with poached eggs, chili flakes, and extra virgin olive oil.',
        price: 280,
      },
      {
        name: 'Full Café Breakfast Combo',
        description:
          'Scrambled eggs, grilled beef sausage, sautéed mushrooms, roasted tomatoes, and toasted sourdough.',
        price: 350,
      },
    ],
  },
  {
    name: 'Mains & Traditional Dishes',
    displayOrder: 3,
    items: [
      {
        name: 'Sizzling Special Beef Tibs',
        description:
          'Prime tenderloin beef strips sautéed with sliced onions, tomatoes, rosemary, garlic, and green chili.',
        price: 450,
      },
      {
        name: 'Shiro Tegabeno Claypot',
        description:
          'Slow-simmered chickpea powder gravy with garlic, ginger, and berbere served bubbling hot with fresh injera.',
        price: 320,
      },
      {
        name: 'Doro Wot (Special Chicken Stew)',
        description:
          'Slow-cooked tender chicken leg in rich berbere sauce with caramelized onions and hard-boiled egg.',
        price: 480,
      },
      {
        name: 'Gomen Besiga (Beef & Greens)',
        description:
          'Tender sautéed beef cubes with fresh collard greens, garlic, ginger, and clarified spiced butter.',
        price: 380,
      },
      {
        name: 'Abol Gourmet Beef Burger',
        description:
          'House-ground prime beef patty, caramelized onions, melted cheddar, lettuce, tomato, and fries on a brioche bun.',
        price: 390,
      },
      {
        name: 'Club Sandwich & Crispy Fries',
        description:
          'Triple-decker toasted sandwich with chicken breast, egg, cheese, lettuce, and crispy french fries.',
        price: 340,
      },
    ],
  },
  {
    name: 'Fresh Juices & Smoothies',
    displayOrder: 4,
    items: [
      {
        name: 'Layered Fresh Spris Juice',
        description:
          'Iconic Ethiopian layered fresh avocado, mango, and papaya puree drizzled with fresh lime juice.',
        price: 130,
      },
      {
        name: 'Ethiopian Spiced Black Tea (Shai)',
        description:
          'Fragrant black tea simmered with cinnamon bark, cardamom pods, clove, and fresh mint leaves.',
        price: 60,
      },
      {
        name: 'Passionfruit & Lime Iced Tea',
        description:
          'Chilled brewed herbal tea blended with natural passionfruit pulp and fresh lime.',
        price: 110,
      },
      {
        name: 'Green Detox Health Smoothie',
        description:
          'Blend of fresh spinach, green apple, cucumber, banana, ginger, and pure coconut water.',
        price: 160,
      },
    ],
  },
  {
    name: 'Pastries & Desserts',
    displayOrder: 5,
    items: [
      {
        name: 'Ethiopian Honey Cake',
        description:
          'Moist layered honey sponge cake infused with cinnamon and topped with sweet cream glaze.',
        price: 180,
      },
      {
        name: 'Warm Chocolate Molten Lava Cake',
        description:
          'Decadent dark chocolate cake with a molten center, served warm with vanilla bean gelato.',
        price: 220,
      },
      {
        name: 'Fresh French Butter Croissant',
        description:
          'Flaky golden butter croissant served warm with organic strawberry jam and butter.',
        price: 140,
      },
      {
        name: 'Classic Espresso Tiramisu',
        description:
          'Classic espresso-soaked ladyfingers with whipped mascarpone cream and dusted cocoa.',
        price: 190,
      },
    ],
  },
];

async function seedRichMenu() {
  console.log('Seeding rich menu categories and items into database...');

  for (const catData of menuData) {
    const category = await prisma.category.upsert({
      where: { name: catData.name },
      update: {
        displayOrder: catData.displayOrder,
        isActive: true,
      },
      create: {
        name: catData.name,
        displayOrder: catData.displayOrder,
        isActive: true,
      },
    });

    console.log(`\nCategory: [${category.name}]`);

    let itemOrder = 1;
    for (const item of catData.items) {
      await prisma.menuItem.upsert({
        where: {
          categoryId_name: {
            categoryId: category.id,
            name: item.name,
          },
        },
        update: {
          description: item.description,
          price: item.price,
          currency: item.currency ?? 'ETB',
          isAvailable: item.isAvailable ?? true,
          displayOrder: itemOrder,
        },
        create: {
          categoryId: category.id,
          name: item.name,
          description: item.description,
          price: item.price,
          currency: item.currency ?? 'ETB',
          isAvailable: item.isAvailable ?? true,
          displayOrder: itemOrder,
        },
      });
      console.log(`  + ${item.name} (${item.price} ${item.currency ?? 'ETB'})`);
      itemOrder += 1;
    }
  }

  console.log('\n✅ Rich menu seeding complete!');
}

seedRichMenu()
  .catch((err) => {
    console.error('Seeding failed:', err);
    process.exitCode = 1;
  })
  .finally(() => {
    prisma.$disconnect();
  });
