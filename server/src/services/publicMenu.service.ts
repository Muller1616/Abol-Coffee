import { prisma } from '../config/database.js';
import { Prisma, RestaurantStatus } from '../generated/prisma/client.js';
import { AppError } from '../utils/AppError.js';
import { formatMoney, toMoneyNumber } from '../utils/money.js';
import { parseOpeningHours } from '../utils/openingHours.js';
import type { PublicMenuQuery } from '../validators/publicMenu.validators.js';

type PublicMenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  priceFormatted: string;
  currency: 'ETB';
  image: string | null;
  isAvailable: true;
  displayOrder: number;
  categoryId: string;
  categoryName: string;
};

type PublicCategory = {
  id: string;
  name: string;
  displayOrder: number;
  items: PublicMenuItem[];
};

type PublicRestaurant = {
  id: string;
  name: string;
  logo: string | null;
  coverImage: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  description: string | null;
  facebook: string | null;
  instagram: string | null;
  telegram: string | null;
  openingHours: ReturnType<typeof parseOpeningHours>;
  status: RestaurantStatus;
};

export type PublicMenuActiveResponse = {
  status: 'ACTIVE';
  restaurant: PublicRestaurant;
  categories: PublicCategory[];
  items: PublicMenuItem[];
};

export type PublicMenuMaintenanceResponse = {
  status: 'MAINTENANCE';
  restaurant: Pick<
    PublicRestaurant,
    'id' | 'name' | 'logo' | 'phone' | 'email' | 'address' | 'description'
  >;
  message: string;
};

export type PublicMenuResponse = PublicMenuActiveResponse | PublicMenuMaintenanceResponse;

function toPublicRestaurant(restaurant: {
  id: string;
  name: string;
  logo: string | null;
  coverImage: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  description: string | null;
  facebook: string | null;
  instagram: string | null;
  telegram: string | null;
  openingHours: Prisma.JsonValue;
  status: RestaurantStatus;
}): PublicRestaurant {
  return {
    id: restaurant.id,
    name: restaurant.name,
    logo: restaurant.logo,
    coverImage: restaurant.coverImage,
    address: restaurant.address,
    phone: restaurant.phone,
    email: restaurant.email,
    description: restaurant.description,
    facebook: restaurant.facebook,
    instagram: restaurant.instagram,
    telegram: restaurant.telegram,
    openingHours: parseOpeningHours(restaurant.openingHours),
    status: restaurant.status,
  };
}

export async function getPublicMenu(query: PublicMenuQuery): Promise<PublicMenuResponse> {
  const restaurant = await prisma.restaurant.findFirst({
    orderBy: { createdAt: 'asc' },
  });

  if (!restaurant) {
    throw new AppError('Restaurant menu is not available', 404);
  }

  if (restaurant.status === RestaurantStatus.MAINTENANCE) {
    return {
      status: 'MAINTENANCE',
      message: 'The menu is temporarily unavailable for maintenance.',
      restaurant: {
        id: restaurant.id,
        name: restaurant.name,
        logo: restaurant.logo,
        phone: restaurant.phone,
        email: restaurant.email,
        address: restaurant.address,
        description: restaurant.description,
      },
    };
  }

  const categories = await prisma.category.findMany({
    where: {
      isActive: true,
      ...(query.categoryId ? { id: query.categoryId } : {}),
    },
    orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
    include: {
      menuItems: {
        where: {
          isAvailable: true,
          ...(query.search
            ? {
                OR: [
                  { name: { contains: query.search, mode: 'insensitive' } },
                  { description: { contains: query.search, mode: 'insensitive' } },
                ],
              }
            : {}),
        },
        orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
      },
    },
  });

  const publicCategories: PublicCategory[] = categories
    .map((category) => {
      const items: PublicMenuItem[] = category.menuItems.map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        price: toMoneyNumber(item.price),
        priceFormatted: formatMoney(item.price),
        currency: 'ETB',
        image: item.image,
        isAvailable: true,
        displayOrder: item.displayOrder,
        categoryId: category.id,
        categoryName: category.name,
      }));

      return {
        id: category.id,
        name: category.name,
        displayOrder: category.displayOrder,
        items,
      };
    })
    .filter((category) => {
      // When searching, hide empty categories. When browsing all, keep empty active categories.
      if (query.search || query.categoryId) {
        return category.items.length > 0;
      }
      return true;
    });

  const items = publicCategories.flatMap((category) => category.items);

  return {
    status: 'ACTIVE',
    restaurant: toPublicRestaurant(restaurant),
    categories: publicCategories,
    items,
  };
}
