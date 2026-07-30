import { prisma } from '../config/database.js';
import { Prisma, RestaurantStatus } from '../generated/prisma/client.js';
import { AppError } from '../utils/AppError.js';
import { formatMoney, toMoneyNumber } from '../utils/money.js';
import { parseOpeningHours } from '../utils/openingHours.js';
import type { PublicMenuQuery } from '../validators/publicMenu.validators.js';
import {
  getCachedPublicMenu,
  setCachedPublicMenu,
} from './publicMenu.cache.js';

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
  city: string | null;
  state: string | null;
  country: string | null;
  postalCode: string | null;
  latitude: number | null;
  longitude: number | null;
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
  city: string | null;
  state: string | null;
  country: string | null;
  postalCode: string | null;
  latitude: number | null;
  longitude: number | null;
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
    city: restaurant.city,
    state: restaurant.state,
    country: restaurant.country,
    postalCode: restaurant.postalCode,
    latitude: restaurant.latitude,
    longitude: restaurant.longitude,
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
  const cached = getCachedPublicMenu(query.search, query.categoryId);
  if (cached) return cached;

  const restaurant = await prisma.restaurant.findFirst({
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      name: true,
      logo: true,
      coverImage: true,
      address: true,
      city: true,
      state: true,
      country: true,
      postalCode: true,
      latitude: true,
      longitude: true,
      phone: true,
      email: true,
      description: true,
      facebook: true,
      instagram: true,
      telegram: true,
      openingHours: true,
      status: true,
    },
  });

  if (!restaurant) {
    throw new AppError('Restaurant menu is not available', 404);
  }

  if (restaurant.status === RestaurantStatus.MAINTENANCE) {
    const maintenance: PublicMenuMaintenanceResponse = {
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
    setCachedPublicMenu(maintenance, query.search, query.categoryId);
    return maintenance;
  }

  const categories = await prisma.category.findMany({
    where: {
      isActive: true,
      ...(query.categoryId ? { id: query.categoryId } : {}),
    },
    orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
    select: {
      id: true,
      name: true,
      displayOrder: true,
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
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          image: true,
          displayOrder: true,
        },
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
      if (query.search || query.categoryId) {
        return category.items.length > 0;
      }
      return true;
    });

  const response: PublicMenuActiveResponse = {
    status: 'ACTIVE',
    restaurant: toPublicRestaurant(restaurant),
    categories: publicCategories,
  };

  setCachedPublicMenu(response, query.search, query.categoryId);
  return response;
}
